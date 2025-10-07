import * as admin from 'firebase-admin'

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Initialize Firebase Admin if not already done
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

    // Test token verification
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Missing Authorization token',
        received: authHeader.substring(0, 20) + '...',
        headers: Object.keys(req.headers)
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decoded;
    
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
      
      return res.json({
        status: 'success',
        message: 'Token verification successful',
        userId: decoded.uid,
        email: decoded.email,
        emailVerified: decoded.email_verified,
        tokenLength: idToken.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (tokenError) {
      return res.status(401).json({ 
        error: 'Token verification failed',
        details: tokenError.message,
        code: tokenError.code,
        tokenLength: idToken.length,
        tokenStart: idToken.substring(0, 20) + '...'
      });
    }

  } catch (error) {
    console.error('Test auth error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}