/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from 'firebase-functions'
import * as logger from 'firebase-functions/logger'

// use v1 realtime database trigger API via functions.database.ref(...).onCreate
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
// Lazy-load heavy libraries (PDFKit, SendGrid) inside the function body to
// avoid long-running initialization during module load which can cause
// deployment timeouts. We'll import them dynamically when needed.
import { tmpdir } from 'os'
import { join } from 'path'
import { createWriteStream } from 'fs'
import { promises as fsPromises } from 'fs'

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// initialize admin sdk
admin.initializeApp()

// Configure SendGrid using environment variable `SENDGRID_API_KEY`.
// Note: `functions.config()` (v1 config) is not available in Cloud Functions v2; use env vars or Secret Manager instead.
const sendgridKey = process.env.SENDGRID_API_KEY || process.env.SENDGRID_KEY
if (!sendgridKey) {
  logger.warn('SendGrid API key not set in environment (SENDGRID_API_KEY); emails will fail until configured.')
}

async function fsReadFileAsBase64(path: string) {
  const buf = await fsPromises.readFile(path)
  return buf.toString('base64')
}

// Use Realtime Database v1 trigger
// Use a safe any-cast to support projects that have the newer firebase-functions types
export const sendDisputeLetter = (() => {
  try {
    const maybeDatabase = (functions as any).database
    if (maybeDatabase && typeof maybeDatabase.ref === 'function') {
      return maybeDatabase
        .ref('/disputeRequests/{pushId}')
        .onCreate(async (snapshot: any, context: any) => {
          const data = (snapshot && typeof snapshot.val === 'function') ? snapshot.val() : (snapshot || {})
          const email = data?.email
          const pushId = context?.params?.pushId
          if (!email) {
            logger.warn('No email found on dispute request', pushId)
            return null
          }

          await processDispute({ email, pushId })
          return null
        })
    }

    logger.warn('Realtime Database trigger not available in this runtime; sendDisputeLetter will not be registered.')
    return null as any
  } catch (err) {
    logger.warn('Error while registering Realtime Database trigger — skipping registration', err)
    return null as any
  }
})()

// Extracted helper so we can call the same logic from an HTTP test endpoint
async function processDispute({ email, pushId }: { email: string; pushId?: string }) {
  if (!email) throw new Error('email required')
  logger.log('processDispute starting for', email, pushId)

  // Generate PDF (dynamically import PDFKit to avoid heavy top-level init)
  const PDFDocument = (await import('pdfkit')).default
  const doc = new PDFDocument({ size: 'A4', margin: 50 })
  const pdfPath = join(tmpdir(), `dispute-letter-${pushId || 'local'}.pdf`)
  const stream = doc.pipe(createWriteStream(pdfPath))

  // Add logo if available in functions folder (we copied it for local testing)
  const logoPath = join(__dirname, '..', 'afs-min.png')
  try {
    doc.image(logoPath, { fit: [120, 120], align: 'center' })
    doc.moveDown()
  } catch (err) {
    logger.warn('Logo not found or failed to load in function bundle', err)
  }

  doc.fontSize(18).text('Credit Dispute Letter', { align: 'center' })
  doc.moveDown(2)

  doc.fontSize(12).text(`To Whom It May Concern,\n\nI am writing to formally dispute inaccurate information on my credit report. Please find attached the relevant details:\n\n- Full Name: ___________________\n- Address: ____________________\n- Email: ${email}\n\nAs per the Fair Credit Reporting Act, I request an investigation into these matters and a correction of any inaccuracies found. Please notify me of the results of your investigation in writing.\n\nSincerely,\nAccredited Financial Services`)

  doc.end()
  await new Promise<void>((resolve, reject) => {
    stream.on('finish', () => resolve())
    stream.on('error', (err) => reject(err))
  })

  // Send email via SendGrid with inline base64 attachment
  const pdfBase64 = await fsReadFileAsBase64(pdfPath)
  const msg: any = {
    to: email,
    from: 'info@accreditedfs.com',
    subject: 'Your Free Credit Dispute Letter from Accredited Financial Services',
    text: 'Attached is your drafted dispute letter. Please review and customize as needed before sending to bureaus.',
    attachments: [
      {
        content: pdfBase64,
        filename: 'dispute-letter.pdf',
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  }

  if (!sendgridKey) {
    logger.warn('SendGrid key not configured; skipping send. PDF saved to', pdfPath)
    // keep the file for inspection in local testing
    return
  }

  try {
    // Dynamically load SendGrid to avoid blocking during module initialization
    const sendgrid = (await import('@sendgrid/mail')).default
    sendgrid.setApiKey(sendgridKey)
    await sendgrid.send(msg)
    logger.info('Dispute letter emailed to', email)
    // write success status back to Realtime DB if pushId provided
    if (pushId) {
      try {
        await admin.database().ref(`/disputeRequests/${pushId}`).update({ status: 'sent', sentAt: admin.database.ServerValue.TIMESTAMP })
      } catch (err) {
        logger.warn('Failed to write sent status for', pushId, err)
      }
    }
  } finally {
    // cleanup local temp file if it exists
    try {
      await fsPromises.unlink(pdfPath)
      logger.debug('Temporary PDF removed:', pdfPath)
    } catch (err) {
      // not fatal; leave the file if deletion fails
      logger.warn('Failed to remove temporary PDF', pdfPath, err)
    }
  }
}

// Admin HTTP endpoint to process pending dispute requests (one-off/resend)
// Protect this endpoint by requiring a secret key in functions config: `firebase functions:config:set admin.key="YOUR_SECRET"`
export const adminProcessDisputes = functions.https.onRequest(async (req, res) => {
  // Use environment variable FUNCTIONS_ADMIN_KEY for v2 compatibility.
  const adminKey = process.env.FUNCTIONS_ADMIN_KEY || process.env.ADMIN_KEY
  const supplied = (req.query.key as string) || req.get('x-admin-key')
  if (!adminKey) {
    res.status(403).send('Admin key not configured on functions; cannot run processing endpoint.')
    return
  }
  if (!supplied || supplied !== adminKey) {
    res.status(401).send('Unauthorized')
    return
  }

  const pushId = req.query.pushId as string | undefined
  try {
    if (pushId) {
      const snap = await admin.database().ref(`/disputeRequests/${pushId}`).once('value')
      if (!snap.exists()) {
        res.status(404).send(`No dispute request found for ${pushId}`)
        return
      }
      const data = snap.val() || {}
      const email = data.email
      if (!email) {
        res.status(400).send('Entry has no email')
        return
      }
      await processDispute({ email, pushId })
      res.status(200).send(`Processed ${pushId}`)
      return
    }

    // process all pending (no status or status !== 'sent')
    const listSnap = await admin.database().ref('/disputeRequests').once('value')
    const items = listSnap.val() || {}
    const results: Record<string, string> = {}
    for (const id of Object.keys(items)) {
      const entry = items[id] || {}
      const status = entry.status
      if (status === 'sent') {
        results[id] = 'already_sent'
        continue
      }
      const email = entry.email
      if (!email) {
        results[id] = 'missing_email'
        continue
      }
      try {
        await processDispute({ email, pushId: id })
        results[id] = 'processed'
      } catch (err: any) {
        logger.error('Error processing', id, err)
        try {
          await admin.database().ref(`/disputeRequests/${id}`).update({ status: 'error', error: String(err), errorAt: admin.database.ServerValue.TIMESTAMP })
        } catch (e) {
          logger.warn('Failed to write error status for', id, e)
        }
        results[id] = 'error'
      }
    }

    res.status(200).json({ results })
  } catch (err) {
    logger.error('adminProcessDisputes failed', err)
    res.status(500).send('Processing failed')
  }
})
// Production: no test HTTP endpoint exported. The DB trigger above calls processDispute when a
// new /disputeRequests child is created. Keep `processDispute` non-exported to avoid exposing an
// extra HTTP surface in production.
