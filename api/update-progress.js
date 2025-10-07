import * as admin from 'firebase-admin'

export default async function handler(req, res) {
  // Set CORS headers for all requests FIRST
  const origin = req.headers.origin;
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
  ];

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Vary', 'Origin');

  // Handle preflight request BEFORE any other logic
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Initialize Firebase Admin only when needed
  let db;
  try {
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
    db = admin.database();
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
    return res.status(500).json({ error: 'Server configuration error', details: error.message });
  }

  // Only accept POST for updating progress
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  try {
    // Verify Firebase ID token from Authorization header
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Authorization token' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid ID token' });
    }

    const { userId, progressUpdate } = req.body;

    // If no userId provided, update current user's progress
    const targetUserId = userId || decoded.uid;

    // For updating other users' progress, you might want to add admin role check here
    // For now, users can only update their own progress unless they're admin
    if (targetUserId !== decoded.uid) {
      // Check if current user is admin (you can implement this based on your admin system)
      const adminCheck = await db.ref(`users/${decoded.uid}/roles/admin`).get();
      if (!adminCheck.exists() || !adminCheck.val()) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    // Update progress in Firebase
    const progressRef = db.ref(`users/${targetUserId}/progress`);
    const currentProgressSnap = await progressRef.get();
    const currentProgress = currentProgressSnap.exists() ? currentProgressSnap.val() : {
      creditScore: { current: null, initial: null, goal: null, lastUpdated: null },
      disputesSubmitted: 0,
      disputesResolved: 0,
      itemsRemoved: 0,
      milestones: []
    };

    // Merge the updates
    const updatedProgress = {
      ...currentProgress,
      ...progressUpdate,
      creditScore: {
        ...currentProgress.creditScore,
        ...(progressUpdate.creditScore || {}),
        lastUpdated: progressUpdate.creditScore ? new Date().toISOString() : currentProgress.creditScore.lastUpdated
      },
      lastUpdated: new Date().toISOString()
    };

    await progressRef.set(updatedProgress);

    res.json({ 
      success: true, 
      message: 'Progress updated successfully',
      progress: updatedProgress 
    });

  } catch (err) {
    console.error('Update Progress API Error:', err);
    res.status(500).json({ 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
}