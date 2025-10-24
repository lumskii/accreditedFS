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

  // Only accept POST for creating a checkout session
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const { plan, mode } = req.body;

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

    // Ensure user exists and email is verified
    const userRecord = await admin.auth().getUser(decoded.uid);
    if (!userRecord.emailVerified) {
      return res.status(403).json({ error: 'Email not verified' });
    }

    // Check agreement flag in RTDB
    const agreementSnap = await db.ref(`users/${decoded.uid}/agreement`).get();
    if (!agreementSnap.exists() || !agreementSnap.val().agreed) {
      return res.status(403).json({ error: 'Agreement not signed' });
    }

    // Map plan names to Stripe Price IDs
    const PRICE_IDS = {
      "credit-refresh": {
        full: process.env.STRIPE_PRICE_REFRESH_FULL,
        deposit: process.env.STRIPE_PRICE_REFRESH_DEPOSIT,
        monthly: process.env.STRIPE_PRICE_REFRESH_MONTHLY,
      },
      "credit-rebuild": {
        full: process.env.STRIPE_PRICE_REBUILD_FULL,
        deposit: process.env.STRIPE_PRICE_REBUILD_DEPOSIT,
        monthly: process.env.STRIPE_PRICE_REBUILD_MONTHLY,
      },
      "couples-advantage": {
        full: process.env.STRIPE_PRICE_COUPLES_FULL,
        deposit: process.env.STRIPE_PRICE_COUPLES_DEPOSIT,
        monthly: process.env.STRIPE_PRICE_COUPLES_MONTHLY,
      },
    };

    // Validate plan and mode
    if (!PRICE_IDS[plan]) {
      return res.status(400).json({ error: `Invalid plan: ${plan}` });
    }
    
    if (!['full', 'monthly'].includes(mode)) {
      return res.status(400).json({ error: `Invalid mode: ${mode}` });
    }

    let line_items = [];

    if (mode === "full") {
      const priceId = PRICE_IDS[plan].full;
      if (!priceId) {
        return res.status(500).json({ error: `Missing price ID for ${plan} full payment` });
      }
      line_items.push({ price: priceId, quantity: 1 });
    } else if (mode === "monthly") {
      const depositPriceId = PRICE_IDS[plan].deposit;
      const monthlyPriceId = PRICE_IDS[plan].monthly;
      
      if (!depositPriceId || !monthlyPriceId) {
        return res.status(500).json({ error: `Missing price IDs for ${plan} monthly payment` });
      }
      
      line_items.push(
        { price: depositPriceId, quantity: 1 },
        { price: monthlyPriceId, quantity: 1 }
      );
    }

    // create or reuse stripe customer
    const userRef = db.ref(`users/${decoded.uid}/stripe`);
    const userSnap = await userRef.get();
    let stripeCustomerId = userSnap.exists() ? userSnap.val().customerId : null;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userRecord.email,
        metadata: { uid: decoded.uid }
      });
      stripeCustomerId = customer.id;
      await userRef.set({ customerId: stripeCustomerId });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: mode === "full" ? "payment" : "subscription",
      line_items,
      customer: stripeCustomerId,
      allow_promotion_codes: true, // Enable promo code field in Stripe checkout
      success_url: `https://accreditedfs.com/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://accreditedfs.com/cancel`,
    });

    // store session info under user
    await db.ref(`users/${decoded.uid}/sessions/${session.id}`).set({
      id: session.id,
      plan,
      mode,
      status: session.status,
      createdAt: Date.now()
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
}
