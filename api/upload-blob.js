import { put } from '@vercel/blob'
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
    if (!admin.apps.length) {
      const required = ['VITE_FIREBASE_PROJECT_ID','VITE_FIREBASE_CLIENT_EMAIL','VITE_FIREBASE_PRIVATE_KEY','VITE_FIREBASE_DATABASE_URL']
      const missing = required.filter(k => !process.env[k])
      if (missing.length) {
        return res.status(500).json({ error: 'Firebase Admin not configured', missing })
      }
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

    // Extract filename from query
    let filename = 'upload.bin'
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
      filename = urlObj.searchParams.get('filename') || 'upload.bin'
    } catch {}

    // Read request body into a Buffer
    const chunks = []
    await new Promise((resolve, reject) => {
      req.on('data', (chunk) => chunks.push(chunk))
      req.on('end', resolve)
      req.on('error', reject)
    })
    const buffer = Buffer.concat(chunks)

    const contentType = req.headers['content-type'] || 'application/octet-stream'
    const limitBytes = 20 * 1024 * 1024 // 20MB
    if (buffer.length > limitBytes) {
      return res.status(413).json({ error: 'File too large', limitMB: 20 })
    }

    // Upload to Vercel Blob using server-side put
    const objectName = `users/${uid}/docs/${Date.now()}_${filename}`
    const { url, pathname } = await put(objectName, buffer, {
      access: 'public',
      contentType
    })

    return res.status(200).json({ url, pathname, name: filename })
  } catch (error) {
    console.error('Blob upload failed:', error)
    return res.status(500).json({ error: 'Blob upload failed', details: error.message })
  }
}
