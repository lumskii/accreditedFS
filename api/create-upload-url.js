import { generateUploadUrl } from '@vercel/blob'
import * as admin from 'firebase-admin'

export default async function handler(req, res) {
  // CORS setup
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.setHeader('Vary', 'Origin')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  try {
    // Verify Firebase ID token
    const authHeader = req.headers.authorization || ''
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Authorization token' })
    }
    const idToken = authHeader.split('Bearer ')[1]

    // Initialize Firebase Admin if needed
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
    const uid = decoded.uid

    const filename = (req.query && req.query.filename) || 'upload.bin'
    const result = await generateUploadUrl({
      access: 'public',
      // Some versions use "pathname", others use "filename"; keep it as filename for broader compatibility
      filename: `users/${uid}/docs/${Date.now()}_${filename}`,
      allowedContentTypes: [
        'image/*',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/octet-stream'
      ]
    })
    // Return whatever the SDK provides (usually { url, token, pathname })
    return res.status(200).json(result)
  } catch (error) {
    console.error('Failed to create upload URL:', error)
    return res.status(500).json({ error: 'Failed to create upload URL', details: error.message })
  }
}
