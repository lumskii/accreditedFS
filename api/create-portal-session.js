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
      if (missing.length) return res.status(500).json({ error: 'Firebase not configured', missing })
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
    const uid = decoded.uid

    // Init Stripe
    if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Stripe not configured' })
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    // Fetch user to get customerId
    const db = admin.database()
    const userSnap = await db.ref(`users/${uid}`).get()
    const userData = userSnap.exists() ? userSnap.val() : {}
    const customerId = userData?.stripe?.customerId
    if (!customerId) return res.status(400).json({ error: 'No Stripe customer linked' })

    const returnUrl = (allowedOrigins.includes(origin) ? origin : 'https://accreditedfs.com') + '/dashboard'
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('Create portal session failed:', err)
    return res.status(500).json({ error: 'Failed to create portal session', details: err.message })
  }
}
