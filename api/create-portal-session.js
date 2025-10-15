import Stripe from 'stripe'
import * as admin from 'firebase-admin'

export default async function handler(req, res) {
  // CORS
  const origin = req.headers.origin
  const allowedOrigins = [
    'https://accreditedfs.com',
    'https://www.accreditedfs.com',
    'https://accreditedfs.web.app',
    'https://api.accreditedfs.com',
    'https://accreditedfs.vercel.app',
    'http://localhost:3000',
    'http://localhost:4000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
  ]
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*')
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Vary', 'Origin')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const authHeader = req.headers.authorization || ''
    if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing Authorization token' })
    const idToken = authHeader.split('Bearer ')[1]

    // Init Firebase Admin
    if (!admin.apps.length) {
      const required = ['VITE_FIREBASE_PROJECT_ID','VITE_FIREBASE_CLIENT_EMAIL','VITE_FIREBASE_PRIVATE_KEY','VITE_FIREBASE_DATABASE_URL']
      const missing = required.filter(k => !process.env[k])
      if (missing.length) return res.status(500).json({ error: 'Firebase not configured', details: `Missing: ${missing.join(', ')}`, type: 'FIREBASE_ENV_MISSING' })
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.VITE_FIREBASE_PROJECT_ID,
            clientEmail: process.env.VITE_FIREBASE_CLIENT_EMAIL,
            privateKey: (process.env.VITE_FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
          }),
          databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
        })
      } catch (firebaseError) {
        console.error('Firebase Admin initialization failed:', firebaseError)
        return res.status(500).json({ error: 'Firebase Admin initialization failed', details: firebaseError.message, type: 'FIREBASE_INIT_ERROR' })
      }
    }
    const decoded = await admin.auth().verifyIdToken(idToken)
    const uid = decoded.uid

    // Init Stripe
    if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Stripe not configured', type: 'STRIPE_ENV_MISSING' })
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    // Fetch user to get or create customerId
    const db = admin.database()
    const userRef = db.ref(`users/${uid}`)
    const userSnap = await userRef.get()
    const userData = userSnap.exists() ? userSnap.val() : {}

    let customerId = userData?.stripe?.customerId
    const email = userData?.email || decoded?.email

    if (!customerId) {
      // Try to find existing Stripe customer by metadata uid first, then by email
      try {
        const searchByUid = await stripe.customers.search({ query: `metadata['uid']:'${uid}'` })
        if (searchByUid.data.length > 0) {
          customerId = searchByUid.data[0].id
        }
      } catch (e) {
        // Ignore search errors, continue to email lookup
      }
      if (!customerId && email) {
        try {
          const searchByEmail = await stripe.customers.search({ query: `email:'${email}'` })
          if (searchByEmail.data.length > 0) {
            customerId = searchByEmail.data[0].id
          }
        } catch (e) {
          // ignore
        }
      }
      // If still not found, create a new customer
      if (!customerId) {
        const created = await stripe.customers.create({ email: email || undefined, metadata: { uid } })
        customerId = created.id
      }
      // Persist under users/{uid}/stripe/customerId without overwriting other stripe fields
      await db.ref(`users/${uid}/stripe`).update({ customerId })
    }

    const returnUrl = (allowedOrigins.includes(origin) ? origin : 'https://accreditedfs.com') + '/dashboard'
    const configId = process.env.STRIPE_PORTAL_CONFIGURATION_ID || undefined
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
      ...(configId ? { configuration: configId } : {})
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('Create portal session failed:', err)
    // Attempt to extract Stripe error details if present
    const details = err?.message || 'Unknown error'
    const type = err?.type || 'UNKNOWN_ERROR'
    return res.status(500).json({ error: 'Failed to create portal session', details, type })
  }
}
