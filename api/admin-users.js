const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

  if (req.method !== 'GET' && req.method !== 'POST') {
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

    // Handle query parameter for system health check
    if (req.method === 'GET' && req.query.action === 'getSystemHealth') {
      const status = {
        api: 'healthy',
        database: 'healthy',
        stripe: 'healthy',
        lastChecked: Date.now()
      };

      try {
        // Check database
        const testRef = admin.database().ref('.info/connected');
        await testRef.once('value');
      } catch (error) {
        console.error('Database health check failed:', error);
        status.database = 'down';
      }

      try {
        // Check Stripe
        await stripe.balance.retrieve();
      } catch (error) {
        console.error('Stripe health check failed:', error);
        status.stripe = 'down';
      }

      return res.status(200).json({ status });
    }

    // Handle query parameter for analytics
    if (req.method === 'GET' && req.query.action === 'getAnalytics') {
      try {
        // Get user count from database
        const usersRef = admin.database().ref('users');
        const usersSnap = await usersRef.once('value');
        const usersData = usersSnap.val() || {};
        
        // Filter out admin users
        const nonAdminUsers = Object.entries(usersData).filter(([uid, userData]) => {
          return !userData.roles || !userData.roles.admin;
        });
        
        const totalUsers = nonAdminUsers.length;
        
        // Count active subscriptions
        let activeSubscriptions = 0;
        nonAdminUsers.forEach(([uid, userData]) => {
          const flow = userData.flow || {};
          if (flow.plan || (userData.currentPlan && userData.currentPlan.status === 'active')) {
            activeSubscriptions++;
          }
        });

        // Get revenue data from Stripe
        let totalRevenue = 0;
        let monthlyRecurringRevenue = 0;
        
        try {
          // Get all successful charges (total revenue)
          const charges = await stripe.charges.list({
            limit: 100
          });
          
          totalRevenue = charges.data
            .filter(charge => charge.paid && !charge.refunded)
            .reduce((sum, charge) => sum + charge.amount, 0);

          // Get active subscriptions for MRR
          const subscriptions = await stripe.subscriptions.list({
            status: 'active',
            limit: 100
          });
          
          monthlyRecurringRevenue = subscriptions.data.reduce((sum, sub) => {
            // Get the plan amount
            if (sub.items && sub.items.data.length > 0) {
              const item = sub.items.data[0];
              const amount = item.price.unit_amount || 0;
              
              // Convert to monthly if annual
              if (item.price.recurring && item.price.recurring.interval === 'year') {
                return sum + (amount / 12);
              }
              return sum + amount;
            }
            return sum;
          }, 0);
        } catch (stripeError) {
          console.error('Error fetching Stripe revenue data:', stripeError);
          // Continue without revenue data rather than failing completely
        }

        const averageRevenuePerUser = activeSubscriptions > 0 
          ? totalRevenue / activeSubscriptions 
          : 0;

        return res.status(200).json({
          analytics: {
            totalUsers,
            activeSubscriptions,
            totalRevenue,
            monthlyRecurringRevenue,
            averageRevenuePerUser
          }
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
        return res.status(500).json({
          error: 'Failed to fetch analytics',
          details: error.message
        });
      }
    }

    // Handle query parameter for fetching promo codes
    if (req.method === 'GET' && req.query.action === 'getPromoCodes') {
      try {
        // Fetch promotion codes from Stripe
        const promoCodes = await stripe.promotionCodes.list({
          limit: 100,
          active: true,
          expand: ['data.coupon']
        });

        // Format the response
        const formattedCodes = promoCodes.data.map(promoCode => ({
          id: promoCode.id,
          code: promoCode.code,
          active: promoCode.active,
          percentOff: promoCode.coupon.percent_off,
          amountOff: promoCode.coupon.amount_off,
          currency: promoCode.coupon.currency,
          redeemBy: promoCode.expires_at,
          maxRedemptions: promoCode.max_redemptions,
          timesRedeemed: promoCode.times_redeemed,
          created: promoCode.created
        }));

        return res.status(200).json({
          promoCodes: formattedCodes,
          total: promoCodes.data.length
        });
      } catch (error) {
        console.error('Error fetching promo codes from Stripe:', error);
        return res.status(500).json({
          error: 'Failed to fetch promotion codes',
          details: error.message
        });
      }
    }

    // Handle POST requests (approve/deny plan change)
    if (req.method === 'POST') {
      const { userId, action, adminComment } = req.body;
      
      if (!userId || !action) {
        return res.status(400).json({ error: 'Missing userId or action' });
      }
      
      if (!['approve', 'deny'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action. Must be approve or deny' });
      }
      
      // Get the plan change request
      const requestRef = admin.database().ref(`planChangeRequests/${userId}`);
      const requestSnap = await requestRef.once('value');
      
      if (!requestSnap.exists()) {
        return res.status(404).json({ error: 'Plan change request not found' });
      }
      
      const requestData = requestSnap.val();
      
      if (requestData.status !== 'pending') {
        return res.status(400).json({ error: `Request already ${requestData.status}` });
      }
      
      // Update the request status
      await requestRef.update({
        status: action === 'approve' ? 'approved' : 'denied',
        reviewedBy: decoded.email,
        reviewedAt: Date.now(),
        adminComment: adminComment || ''
      });
      
      console.log(`Plan change request ${action}d for user ${userId} by ${decoded.email}`);
      
      return res.status(200).json({ 
        success: true,
        message: `Plan change ${action}d successfully`,
        requestId: userId,
        status: action === 'approve' ? 'approved' : 'denied'
      });
    }

    // Handle GET requests (fetch all users)
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