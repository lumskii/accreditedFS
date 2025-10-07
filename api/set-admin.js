import * as admin from 'firebase-admin'

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
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

  // Only accept POST for setting admin role
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  try {
    // For initial setup, we don't require authentication
    // We'll find the user by email and set their admin role
    const { userEmail, targetUserId, adminSecret } = req.body;

    // Check admin secret (you should set this in your environment variables)
    const expectedSecret = process.env.ADMIN_SETUP_SECRET || 'admin123'; // Change this!
    if (adminSecret !== expectedSecret) {
      return res.status(403).json({ error: 'Invalid admin setup secret' });
    }

    let targetUid = targetUserId;

    // If email is provided instead of UID, find the user by email
    if (userEmail && !targetUserId) {
      try {
        const userRecord = await admin.auth().getUserByEmail(userEmail);
        targetUid = userRecord.uid;
      } catch (emailError) {
        return res.status(404).json({ error: `User not found with email: ${userEmail}` });
      }
    }

    if (!targetUid) {
      return res.status(400).json({ error: 'Either userEmail or targetUserId must be provided' });
    }

    // Set admin role for the target user
    await db.ref(`users/${targetUid}/roles/admin`).set(true);

    console.log(`✅ Admin role granted to user: ${targetUid} (${userEmail || 'unknown email'})`);

    res.json({ 
      success: true, 
      message: `Admin role granted to user: ${userEmail || targetUid}`,
      uid: targetUid
    });

  } catch (error) {
    console.error('Set admin role error:', error);
    res.status(500).json({ 
      error: error.message,
      type: 'SET_ADMIN_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}