import Stripe from "stripe";
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

  // Initialize services only when needed (not during OPTIONS)
  let stripe, db;
  try {
    // Check required environment variables
    const requiredEnvVars = [
      'STRIPE_SECRET_KEY',
      'VITE_FIREBASE_PROJECT_ID', 
      'VITE_FIREBASE_CLIENT_EMAIL',
      'VITE_FIREBASE_PRIVATE_KEY',
      'VITE_FIREBASE_DATABASE_URL'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.error('Missing environment variables:', missingVars);
      return res.status(500).json({ error: `Missing environment variables: ${missingVars.join(', ')}` });
    }

    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Initialize Firebase Admin only when needed
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.VITE_FIREBASE_PROJECT_ID,
          clientEmail: process.env.VITE_FIREBASE_CLIENT_EMAIL,
          // private key needs newlines
          privateKey: (process.env.VITE_FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
      })
    }
    db = admin.database();
  } catch (error) {
    console.error('Service initialization failed:', error);
    return res.status(500).json({ error: 'Server configuration error', details: error.message });
  }

  // Only accept GET for fetching dashboard data
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
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

    // Get user info
    const userRecord = await admin.auth().getUser(decoded.uid);
    
    // Get user data from database
    const userRef = db.ref(`users/${decoded.uid}`);
    const userSnap = await userRef.get();
    const userData = userSnap.exists() ? userSnap.val() : {};

    // Get Stripe customer info and payment history
    let paymentHistory = [];
    let subscriptions = [];
    let upcomingInvoices = [];
    let currentPlan = null;

    if (userData.stripe?.customerId) {
      try {
        // Get payment intents (one-time payments)
        const paymentIntents = await stripe.paymentIntents.list({
          customer: userData.stripe.customerId,
          limit: 100
        });

        // Get charges for completed payments
        const charges = await stripe.charges.list({
          customer: userData.stripe.customerId,
          limit: 100
        });

        // Get subscriptions
        const customerSubscriptions = await stripe.subscriptions.list({
          customer: userData.stripe.customerId,
          limit: 100
        });

        subscriptions = customerSubscriptions.data;

        // Get upcoming invoices
        if (subscriptions.length > 0) {
          try {
            const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
              customer: userData.stripe.customerId
            });
            upcomingInvoices = [upcomingInvoice];
          } catch (e) {
            // No upcoming invoice
          }
        }

        // Format payment history
        paymentHistory = charges.data.map(charge => ({
          id: charge.id,
          amount: charge.amount / 100, // Convert from cents
          currency: charge.currency.toUpperCase(),
          status: charge.status,
          description: charge.description || 'Payment',
          created: new Date(charge.created * 1000).toISOString(),
          receiptUrl: charge.receipt_url
        }));

        // Determine current plan from active subscriptions
        if (subscriptions.length > 0) {
          const activeSubscription = subscriptions.find(sub => sub.status === 'active');
          if (activeSubscription) {
            currentPlan = {
              id: activeSubscription.id,
              status: activeSubscription.status,
              currentPeriodEnd: new Date(activeSubscription.current_period_end * 1000).toISOString(),
              plan: activeSubscription.items.data[0]?.price?.nickname || 'Unknown Plan'
            };
          }
        }

      } catch (stripeError) {
        console.error('Stripe API error:', stripeError);
        // Continue without Stripe data
      }
    }

    // Get progress data (sessions and any progress tracking)
    const sessionsRef = db.ref(`users/${decoded.uid}/sessions`);
    const sessionsSnap = await sessionsRef.get();
    const sessions = sessionsSnap.exists() ? Object.values(sessionsSnap.val()) : [];

    // Get progress tracking if it exists
    const progressRef = db.ref(`users/${decoded.uid}/progress`);
    const progressSnap = await progressRef.get();
    const progress = progressSnap.exists() ? progressSnap.val() : null;

    // Build dashboard response
    const dashboardData = {
      user: {
        uid: decoded.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        displayName: userRecord.displayName,
        joinDate: new Date(parseInt(userRecord.metadata.creationTime)).toISOString()
      },
      currentPlan,
      paymentHistory: paymentHistory.sort((a, b) => new Date(b.created) - new Date(a.created)),
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        status: sub.status,
        currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
        plan: sub.items.data[0]?.price?.nickname || 'Unknown Plan',
        amount: sub.items.data[0]?.price?.unit_amount ? sub.items.data[0].price.unit_amount / 100 : 0
      })),
      upcomingInvoices: upcomingInvoices.map(invoice => ({
        id: invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency.toUpperCase(),
        dueDate: new Date(invoice.due_date * 1000).toISOString(),
        status: invoice.status
      })),
      sessions,
      progress: progress || {
        creditScore: {
          current: null,
          initial: null,
          goal: null,
          lastUpdated: null
        },
        disputesSubmitted: 0,
        disputesResolved: 0,
        itemsRemoved: 0,
        milestones: []
      },
      agreement: userData.agreement || { agreed: false }
    };

    res.json(dashboardData);
  } catch (err) {
    console.error('Dashboard API Error:', err);
    res.status(500).json({ 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
}