const admin = require('firebase-admin');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,  // Back to camelCase like working files
      clientEmail: process.env.VITE_FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.VITE_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`
  });
}

export default async function handler(req, res) {
  // Set CORS headers for multiple domains
  const allowedOrigins = [
    'https://accreditedfs.com',
    'https://www.accreditedfs.com',
    'https://accreditedfs.web.app',
    'https://accreditedfs.firebaseapp.com',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://accreditedfs.com');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    let decoded;
    
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user is admin
    const adminRoleRef = admin.database().ref(`users/${decoded.uid}/roles/admin`);
    const adminRoleSnap = await adminRoleRef.once('value');
    
    if (!adminRoleSnap.exists() || !adminRoleSnap.val()) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('Admin access verified for:', decoded.email);

    // Get all users from database
    const usersRef = admin.database().ref('users');
    const usersSnap = await usersRef.once('value');
    
    if (!usersSnap.exists()) {
      return res.status(200).json({ users: [] });
    }

    const usersData = usersSnap.val();
    const usersList = [];

    // Process each user and get their auth data
    for (const [uid, userData] of Object.entries(usersData)) {
      try {
        // Skip users who have admin roles - they shouldn't appear in the user list
        if (userData.roles && userData.roles.admin) {
          console.log(`Skipping admin user: ${uid}`);
          continue;
        }

        // Get user record from Firebase Auth
        const userRecord = await admin.auth().getUser(uid);
        
        // Combine database profile data with auth data
        const profile = userData.profile || {};
        const progress = userData.progress || {};
        const flow = userData.flow || {};
        
        // Extract plan information from flow object or fallback to currentPlan
        let currentPlan = null;
        if (flow.plan) {
          currentPlan = {
            name: flow.plan,
            mode: flow.mode || 'unknown',
            signupAt: flow.signupAt || null,
            status: 'active' // Assume active if they have flow data
          };
        } else if (userData.currentPlan) {
          currentPlan = userData.currentPlan;
        }
        
        const user = {
          uid,
          email: userRecord.email,
          displayName: userRecord.displayName || profile.name || profile.displayName || '',
          emailVerified: userRecord.emailVerified, // This is the actual Firebase Auth verification status
          joinDate: userRecord.metadata.creationTime,
          lastSignIn: userRecord.metadata.lastSignInTime,
          currentPlan,
          progress: {
            creditScore: progress.creditScore || null,
            disputesSubmitted: progress.disputesSubmitted || 0,
            disputesResolved: progress.disputesResolved || 0, 
            itemsRemoved: progress.itemsRemoved || 0,
            disputesCompleted: progress.disputesCompleted || 0,
            milestones: progress.milestones || {}
          },
          profile: {
            name: profile.name || '',
            phone: profile.phone || '',
            createdAt: profile.createdAt || null
          },
          roles: userData.roles || {}
        };

        usersList.push(user);
      } catch (authError) {
        console.warn(`Could not get auth data for user ${uid}:`, authError.message);
        
        // Skip users who have admin roles even in fallback
        if (userData.roles && userData.roles.admin) {
          console.log(`Skipping admin user in fallback: ${uid}`);
          continue;
        }
        
        // If we can't get auth data, use database data as fallback
        const profile = userData.profile || {};
        const progress = userData.progress || {};
        const flow = userData.flow || {};
        
        // Extract plan information from flow object or fallback to currentPlan
        let currentPlan = null;
        if (flow.plan) {
          currentPlan = {
            name: flow.plan,
            mode: flow.mode || 'unknown',
            signupAt: flow.signupAt || null,
            status: 'active' // Assume active if they have flow data
          };
        } else if (userData.currentPlan) {
          currentPlan = userData.currentPlan;
        }
        
        usersList.push({
          uid,
          email: profile.email || '',
          displayName: profile.name || profile.displayName || '',
          emailVerified: false, // Default to false if we can't verify
          joinDate: profile.createdAt ? new Date(profile.createdAt).toISOString() : new Date().toISOString(),
          lastSignIn: null,
          currentPlan,
          progress: {
            creditScore: progress.creditScore || null,
            disputesSubmitted: progress.disputesSubmitted || 0,
            disputesResolved: progress.disputesResolved || 0, 
            itemsRemoved: progress.itemsRemoved || 0,
            disputesCompleted: progress.disputesCompleted || 0,
            milestones: progress.milestones || {}
          },
          profile: {
            name: profile.name || '',
            phone: profile.phone || '',
            createdAt: profile.createdAt || null
          },
          roles: userData.roles || {}
        });
      }
    }

    // Sort users by join date (newest first)
    usersList.sort((a, b) => {
      const dateA = new Date(a.joinDate);
      const dateB = new Date(b.joinDate);
      return dateB.getTime() - dateA.getTime();
    });

    console.log(`Returning ${usersList.length} users to admin`);
    
    return res.status(200).json({ 
      users: usersList,
      totalUsers: usersList.length,
      verifiedUsers: usersList.filter(u => u.emailVerified).length,
      unverifiedUsers: usersList.filter(u => !u.emailVerified).length
    });

  } catch (error) {
    console.error('Admin users fetch error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error.message 
    });
  }
}