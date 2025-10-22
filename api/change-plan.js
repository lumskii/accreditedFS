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

  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Initialize services only when needed
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
      return res.status(500).json({ 
        error: 'Server configuration error', 
        details: 'Missing required environment variables'
      });
    }

    // Initialize Stripe
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });

    // Initialize Firebase Admin
    if (admin.apps.length === 0) {
      const privateKey = process.env.VITE_FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.VITE_FIREBASE_PROJECT_ID,
          clientEmail: process.env.VITE_FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
      });
    }
    db = admin.database();

  } catch (error) {
    console.error('Service initialization error:', error);
    return res.status(500).json({ 
      error: 'Service initialization failed',
      details: error.message 
    });
  }

  try {
    // Get Firebase ID token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the ID token
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Extract request data
    const { newPlanId, billingCycle } = req.body;

    if (!newPlanId || !billingCycle) {
      return res.status(400).json({ error: 'Missing required fields: newPlanId, billingCycle' });
    }

    if (!['full', 'monthly'].includes(billingCycle)) {
      return res.status(400).json({ error: 'Invalid billing cycle. Must be "full" or "monthly"' });
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

    // Validate new plan
    if (!PRICE_IDS[newPlanId]) {
      return res.status(400).json({ error: `Invalid plan: ${newPlanId}` });
    }

    // Get customer's current subscription from Stripe
    const customers = await stripe.customers.list({
      email: decoded.email,
      limit: 1
    });

    if (!customers.data.length) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = customers.data[0];
    
    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1
    });

    if (!subscriptions.data.length) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const currentSubscription = subscriptions.data[0];

    // Determine new price ID based on billing cycle
    let newPriceId;
    if (billingCycle === 'full') {
      newPriceId = PRICE_IDS[newPlanId].full;
    } else {
      // For monthly, we need to handle this differently since it involves setup + recurring
      // For now, we'll create a new subscription with the deposit + monthly structure
      newPriceId = PRICE_IDS[newPlanId].monthly;
    }

    if (!newPriceId) {
      return res.status(500).json({ error: `Missing price ID for ${newPlanId} ${billingCycle} payment` });
    }

    let result;

    if (billingCycle === 'full') {
      // For full payment plans, update the subscription
      result = await stripe.subscriptions.update(currentSubscription.id, {
        items: [{
          id: currentSubscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
      });
    } else {
      // For monthly plans, we need to cancel current and create new with setup fee
      // This is more complex and might need custom handling
      const depositPriceId = PRICE_IDS[newPlanId].deposit;
      
      if (!depositPriceId) {
        return res.status(500).json({ error: `Missing deposit price ID for ${newPlanId}` });
      }

      // Create a new subscription with both setup fee and monthly price
      result = await stripe.subscriptions.create({
        customer: customer.id,
        items: [
          { price: depositPriceId, quantity: 1 }, // One-time setup fee
          { price: newPriceId, quantity: 1 }       // Recurring monthly
        ],
        proration_behavior: 'create_prorations',
      });

      // Cancel the old subscription at period end
      await stripe.subscriptions.update(currentSubscription.id, {
        cancel_at_period_end: true
      });
    }

    // Update user data in Firebase
    const planNames = {
      'credit-refresh': 'Credit Refresh',
      'credit-rebuild': 'Credit Rebuild', 
      'couples-advantage': 'Couples Advantage'
    };

    const userRef = db.ref(`users/${decoded.uid}`);
    await userRef.update({
      'planChange': {
        newPlan: newPlanId,
        newPlanName: planNames[newPlanId],
        billingCycle: billingCycle,
        subscriptionId: result.id,
        changedAt: admin.database.ServerValue.TIMESTAMP,
        status: 'active'
      }
    });

    // Log the plan change
    console.log(`Plan change for user ${decoded.uid}: ${newPlanId} (${billingCycle})`);

    return res.status(200).json({
      success: true,
      subscriptionId: result.id,
      status: result.status,
      message: 'Plan change successful'
    });

  } catch (error) {
    console.error('Plan change error:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return res.status(400).json({ 
        error: 'Payment failed', 
        details: error.message 
      });
    }
    
    if (error.type === 'StripeRateLimitError') {
      return res.status(429).json({ 
        error: 'Too many requests', 
        details: 'Please try again later' 
      });
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        error: 'Invalid request', 
        details: error.message 
      });
    }
    
    if (error.type === 'StripeAPIError') {
      return res.status(500).json({ 
        error: 'Stripe API error', 
        details: 'Payment system temporarily unavailable' 
      });
    }
    
    if (error.type === 'StripeConnectionError') {
      return res.status(500).json({ 
        error: 'Network error', 
        details: 'Unable to connect to payment system' 
      });
    }
    
    if (error.type === 'StripeAuthenticationError') {
      return res.status(500).json({ 
        error: 'Payment configuration error', 
        details: 'Please contact support' 
      });
    }

    return res.status(500).json({ 
      error: 'Plan change failed', 
      details: error.message 
    });
  }
}