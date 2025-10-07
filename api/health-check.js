import * as admin from 'firebase-admin'

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check environment variables (without exposing their values)
    const envVars = [
      'STRIPE_SECRET_KEY',
      'VITE_FIREBASE_PROJECT_ID', 
      'VITE_FIREBASE_CLIENT_EMAIL',
      'VITE_FIREBASE_PRIVATE_KEY',
      'VITE_FIREBASE_DATABASE_URL'
    ];
    
    const envStatus = {};
    envVars.forEach(varName => {
      const value = process.env[varName];
      envStatus[varName] = {
        exists: !!value,
        length: value ? value.length : 0,
        firstFew: value ? value.substring(0, 10) + '...' : 'NOT_SET'
      };
    });

    // Test Firebase Admin initialization
    let firebaseStatus = 'NOT_INITIALIZED';
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.VITE_FIREBASE_PROJECT_ID,
            clientEmail: process.env.VITE_FIREBASE_CLIENT_EMAIL,
            privateKey: (process.env.VITE_FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
          }),
          databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
        });
      }
      firebaseStatus = 'INITIALIZED_SUCCESS';
    } catch (firebaseError) {
      firebaseStatus = `INIT_ERROR: ${firebaseError.message}`;
    }

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      envVars: envStatus,
      firebase: firebaseStatus,
      platform: process.platform,
      nodeVersion: process.version
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}