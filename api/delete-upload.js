import { del } from '@vercel/blob'
import * as admin from 'firebase-admin'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  try {
    const authHeader = req.headers.authorization || ''
    if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing Authorization token' })
    const idToken = authHeader.split('Bearer ')[1]
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.VITE_FIREBASE_PROJECT_ID,
          clientEmail: process.env.VITE_FIREBASE_CLIENT_EMAIL,
          privateKey: (process.env.VITE_FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
      })
    }
    const decoded = await admin.auth().verifyIdToken(idToken)
    const adminRef = admin.database().ref(`users/${decoded.uid}/roles/admin`)
    const adminSnap = await adminRef.get()
    if (!adminSnap.exists() || !adminSnap.val()) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { userId, uploadKey, url } = req.body || {}
    if (!userId || !uploadKey || !url) return res.status(400).json({ error: 'Missing userId, uploadKey, or url' })

    // Delete blob (url can be passed directly to del)
    try {
      await del(url)
    } catch (e) {
      // Log and continue to try metadata cleanup
      console.warn('Blob delete error:', e.message)
    }

    // Remove metadata from RTDB
    try {
      await admin.database().ref(`users/${userId}/uploads/${uploadKey}`).remove()
    } catch (e) {
      console.warn('RTDB delete error:', e.message)
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Delete upload failed:', error)
    return res.status(500).json({ error: 'Delete upload failed', details: error.message })
  }
}
