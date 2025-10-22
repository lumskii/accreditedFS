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
      return res.status(500).json({ 
        error: `Missing environment variables: ${missingVars.join(', ')}`,
        type: 'ENV_VARS_MISSING'
      });
    }

    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Initialize Firebase Admin only when needed
    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.VITE_FIREBASE_PROJECT_ID,
            clientEmail: process.env.VITE_FIREBASE_CLIENT_EMAIL,
            // private key needs newlines
            privateKey: (process.env.VITE_FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
          }),
          databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
        })
      } catch (firebaseError) {
        console.error('Firebase Admin initialization failed:', firebaseError);
        return res.status(500).json({ 
          error: 'Firebase Admin initialization failed', 
          details: firebaseError.message,
          type: 'FIREBASE_INIT_ERROR'
        });
      }
    }
    db = admin.database();
  } catch (error) {
    console.error('Service initialization failed:', error);
    return res.status(500).json({ 
      error: 'Server configuration error', 
      details: error.message,
      type: 'SERVICE_INIT_ERROR'
    });
  }

  // Accept both GET (dashboard data) and POST (plan changes)
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
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
    
    // Handle POST request for plan change requests (hybrid system)
    if (req.method === "POST") {
      return await handlePlanChangeRequest(req, res, decoded, stripe, db);
    }
    
    // Handle PATCH request for executing approved plan changes (admin action)
    if (req.method === "PATCH") {
      const { action, requestId } = req.body;
      if (action === 'executePlanChange') {
        return await handleExecuteApprovedPlanChange(req, res, decoded, stripe, db);
      }
    }
    
    // Handle GET request for dashboard data (includes plan change requests)
    return await handleDashboardData(req, res, decoded, userRecord, stripe, db);
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}

// Plan change request handler function (HYBRID SYSTEM)
// Immediate approval for: Upgrades & Lateral moves
// Requires approval for: Downgrades
async function handlePlanChangeRequest(req, res, decoded, stripe, db) {
  try {
    console.log('=== Plan Change Request ===')
    console.log('User:', decoded.email, decoded.uid)
    console.log('Request body:', req.body)
    
    // Extract request data
    const { newPlanId, billingCycle, reason } = req.body;

    if (!newPlanId || !billingCycle) {
      console.error('Missing required fields:', { newPlanId, billingCycle })
      return res.status(400).json({ error: 'Missing required fields: newPlanId, billingCycle' });
    }

    if (!['full', 'monthly'].includes(billingCycle)) {
      console.error('Invalid billing cycle:', billingCycle)
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

    console.log('Available price IDs:', PRICE_IDS)

    // Validate new plan
    if (!PRICE_IDS[newPlanId]) {
      console.error('Invalid plan ID:', newPlanId)
      return res.status(400).json({ error: `Invalid plan: ${newPlanId}` });
    }

    // Get customer's current subscription from Stripe
    console.log('Looking up customer by email:', decoded.email)
    const customers = await stripe.customers.list({
      email: decoded.email,
      limit: 1
    });

    if (!customers.data.length) {
      console.error('Customer not found for email:', decoded.email)
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = customers.data[0];
    console.log('Found customer:', customer.id)
    
    // Get active subscriptions
    console.log('Looking up active subscriptions for customer:', customer.id)
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1
    });

    if (!subscriptions.data.length) {
      console.error('No active subscription found for customer:', customer.id)
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const currentSubscription = subscriptions.data[0];
    console.log('Found active subscription:', currentSubscription.id)

    // Determine new price ID based on billing cycle
    let newPriceId;
    if (billingCycle === 'full') {
      newPriceId = PRICE_IDS[newPlanId].full;
    } else {
      newPriceId = PRICE_IDS[newPlanId].monthly;
    }

    console.log('Selected price ID:', newPriceId, 'for', newPlanId, billingCycle)

    if (!newPriceId) {
      console.error('Missing price ID for:', newPlanId, billingCycle)
      console.error('Available prices for plan:', PRICE_IDS[newPlanId])
      return res.status(500).json({ 
        error: `Missing price ID for ${newPlanId} ${billingCycle} payment`,
        availablePrices: PRICE_IDS[newPlanId]
      });
    }

    // HYBRID SYSTEM: Determine if approval is required
    // Get current and new prices to compare
    const currentPriceId = currentSubscription.items.data[0]?.price?.id;
    let requiresApproval = false;
    let changeType = 'lateral';
    
    try {
      const currentPrice = await stripe.prices.retrieve(currentPriceId);
      const newPrice = await stripe.prices.retrieve(newPriceId);
      
      const currentAmount = currentPrice.unit_amount || 0;
      const newAmount = newPrice.unit_amount || 0;
      
      if (newAmount > currentAmount) {
        changeType = 'upgrade';
        requiresApproval = false; // Upgrades are auto-approved
      } else if (newAmount < currentAmount) {
        changeType = 'downgrade';
        requiresApproval = true; // Downgrades require approval
      } else {
        changeType = 'lateral';
        requiresApproval = false; // Lateral moves are auto-approved
      }
      
      console.log('Change type:', changeType, '| Requires approval:', requiresApproval);
      console.log('Price comparison:', { currentAmount, newAmount });
    } catch (priceError) {
      console.error('Error comparing prices:', priceError);
      // If we can't determine, require approval to be safe
      requiresApproval = true;
    }

    // If downgrade, create a pending request instead of executing immediately
    if (requiresApproval) {
      const planNames = {
        'credit-refresh': 'Credit Refresh',
        'credit-rebuild': 'Credit Rebuild', 
        'couples-advantage': 'Couples Advantage'
      };
      
      // Get current plan name from the current subscription
      const currentPlanName = PRICE_TO_PLAN_MAP[currentPriceId] || 'Unknown Plan';
      const newPlanName = planNames[newPlanId] || 'Unknown Plan';
      
      // Store the plan change request in Firebase
      const requestRef = db.ref(`planChangeRequests/${decoded.uid}`);
      await requestRef.set({
        userId: decoded.uid,
        userEmail: decoded.email,
        userName: decoded.name || decoded.email,
        currentPlan: currentPlanName,  // Plan name for display
        newPlan: newPlanName,          // Plan name for display
        currentPrice: currentAmount,   // Price in cents
        newPrice: newAmount,          // Price in cents
        paymentMode: billingCycle,    // 'full' or 'monthly'
        currentPlanId: currentPriceId,
        requestedPlanId: newPlanId,
        requestedPriceId: newPriceId,
        changeType: changeType,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        subscriptionId: currentSubscription.id,
        customerId: customer.id
      });

      console.log('Plan change request created (pending approval):', decoded.uid);

      return res.status(200).json({
        success: true,
        requiresApproval: true,
        message: 'Your downgrade request has been submitted for admin review. You will be notified once approved.',
        requestType: changeType
      });
    }

    // If upgrade or lateral move, proceed with immediate execution
    console.log('Auto-approving plan change:', changeType);

    let result;

    if (billingCycle === 'full') {
      // For full payment plans, we need to create a one-time payment and cancel subscription
      // First, validate that the price is a one-time payment price
      try {
        const price = await stripe.prices.retrieve(newPriceId);
        console.log('Price details:', { id: price.id, type: price.type, recurring: price.recurring });
        
        if (price.type !== 'one_time') {
          return res.status(400).json({ 
            error: `Full payment plan requires a one-time price, but got type: ${price.type}`,
            priceId: newPriceId,
            details: 'Please check your Stripe price configuration'
          });
        }
      } catch (priceError) {
        console.error('Error retrieving price:', priceError);
        return res.status(500).json({ 
          error: 'Invalid price ID or unable to retrieve price information',
          priceId: newPriceId
        });
      }

      // Create a payment session for the one-time payment
      try {
        const session = await stripe.checkout.sessions.create({
          customer: customer.id,
          payment_method_types: ['card'],
          mode: 'payment', // One-time payment mode
          line_items: [{
            price: newPriceId,
            quantity: 1,
          }],
          success_url: `${process.env.VITE_SITE_URL || 'https://accreditedfs.com'}/dashboard?session_id={CHECKOUT_SESSION_ID}&plan_change=success`,
          cancel_url: `${process.env.VITE_SITE_URL || 'https://accreditedfs.com'}/dashboard?plan_change=cancelled`,
          metadata: {
            plan_change: 'true',
            new_plan: newPlanId,
            billing_cycle: billingCycle,
            user_id: decoded.uid,
            old_subscription_id: currentSubscription.id
          }
        });

        // Schedule the old subscription to be cancelled (don't cancel immediately to allow grace period)
        await stripe.subscriptions.update(currentSubscription.id, {
          cancel_at_period_end: true,
          metadata: {
            plan_change_pending: 'true',
            new_checkout_session: session.id
          }
        });

        result = { 
          type: 'checkout_session',
          checkout_session: session,
          old_subscription_id: currentSubscription.id
        };
      } catch (sessionError) {
        console.error('Error creating checkout session:', sessionError);
        return res.status(500).json({ 
          error: 'Failed to create payment session',
          details: sessionError.message
        });
      }
    } else {
      // For monthly plans - existing users changing plans should NOT be charged setup fees again
      // Setup fees are only for new customers, not plan changes
      
      // Validate that monthly price is recurring
      try {
        const monthlyPrice = await stripe.prices.retrieve(newPriceId);
        
        if (monthlyPrice.type !== 'recurring') {
          return res.status(400).json({ 
            error: `Monthly plan requires a recurring price, but got type: ${monthlyPrice.type}`,
            priceId: newPriceId
          });
        }
        
        console.log('Monthly price validated:', { id: monthlyPrice.id, type: monthlyPrice.type })
      } catch (priceError) {
        console.error('Error retrieving monthly price:', priceError);
        return res.status(500).json({ 
          error: 'Invalid price ID for monthly plan'
        });
      }

      // Update existing subscription to new monthly plan (no setup fee for plan changes)
      result = await stripe.subscriptions.update(currentSubscription.id, {
        items: [{
          id: currentSubscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
      });

      console.log('Updated subscription to new monthly plan:', result.id)
    }

    // Update user data in Firebase
    const planNames = {
      'credit-refresh': 'Credit Refresh',
      'credit-rebuild': 'Credit Rebuild', 
      'couples-advantage': 'Couples Advantage'
    };

    const userRef = db.ref(`users/${decoded.uid}`);
    
    if (result.type === 'checkout_session') {
      // For full payment plans, store pending state until payment is completed
      await userRef.update({
        'planChange': {
          newPlan: newPlanId,
          newPlanName: planNames[newPlanId],
          billingCycle: billingCycle,
          checkoutSessionId: result.checkout_session.id,
          oldSubscriptionId: result.old_subscription_id,
          changedAt: admin.database.ServerValue.TIMESTAMP,
          status: 'pending_payment'
        }
      });

      console.log(`Plan change initiated for user ${decoded.uid}: ${newPlanId} (${billingCycle}) - Checkout session created`);

      return res.status(200).json({
        success: true,
        requiresPayment: true,
        checkoutUrl: result.checkout_session.url,
        sessionId: result.checkout_session.id,
        message: 'Please complete payment to finish plan change'
      });
    } else {
      // For monthly subscription changes
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

      console.log(`Plan change completed for user ${decoded.uid}: ${newPlanId} (${billingCycle})`);

      return res.status(200).json({
        success: true,
        subscriptionId: result.id,
        status: result.status,
        message: 'Plan change successful'
      });
    }

  } catch (error) {
    console.error('=== Plan Change Error ===');
    console.error('Error type:', error.type);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return res.status(400).json({ 
        error: 'Payment failed', 
        details: error.message,
        code: error.code
      });
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        error: 'Invalid request to Stripe', 
        details: error.message,
        code: error.code
      });
    }
    
    return res.status(500).json({ 
      error: 'Plan change failed', 
      details: error.message,
      type: error.type || 'UnknownError'
    });
  }
}

// Handle executing an approved plan change (called when user confirms after admin approval)
async function handleExecuteApprovedPlanChange(req, res, decoded, stripe, db) {
  try {
    console.log('=== Executing Approved Plan Change ===');
    console.log('User:', decoded.email, decoded.uid);
    
    // Get the approved request from Firebase
    const requestRef = db.ref(`planChangeRequests/${decoded.uid}`);
    const requestSnap = await requestRef.get();
    
    if (!requestSnap.exists()) {
      return res.status(404).json({ error: 'No plan change request found' });
    }
    
    const request = requestSnap.val();
    
    if (request.status !== 'approved') {
      return res.status(400).json({ 
        error: 'Plan change request is not approved',
        status: request.status
      });
    }
    
    console.log('Executing approved plan change:', request);
    
    // Execute the plan change using the stored request data
    const { requestedPlanId, requestedBilling, requestedPriceId, subscriptionId, customerId } = request;
    
    const customer = await stripe.customers.retrieve(customerId);
    const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    let result;
    
    if (requestedBilling === 'full') {
      // Create checkout session for one-time payment
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [{ price: requestedPriceId, quantity: 1 }],
        success_url: `${process.env.VITE_SITE_URL || 'https://accreditedfs.com'}/dashboard?session_id={CHECKOUT_SESSION_ID}&plan_change=success`,
        cancel_url: `${process.env.VITE_SITE_URL || 'https://accreditedfs.com'}/dashboard?plan_change=cancelled`,
        metadata: {
          plan_change: 'true',
          new_plan: requestedPlanId,
          billing_cycle: requestedBilling,
          user_id: decoded.uid,
          old_subscription_id: subscriptionId
        }
      });
      
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
        metadata: { plan_change_pending: 'true', new_checkout_session: session.id }
      });
      
      result = { type: 'checkout_session', checkout_session: session };
    } else {
      // Update subscription for monthly plan
      result = await stripe.subscriptions.update(subscriptionId, {
        items: [{ id: currentSubscription.items.data[0].id, price: requestedPriceId }],
        proration_behavior: 'create_prorations',
      });
    }
    
    // Update request status to executed
    await requestRef.update({
      status: 'executed',
      executedAt: admin.database.ServerValue.TIMESTAMP
    });
    
    const planNames = {
      'credit-refresh': 'Credit Refresh',
      'credit-rebuild': 'Credit Rebuild',
      'couples-advantage': 'Couples Advantage'
    };
    
    // Update user plan data
    const userRef = db.ref(`users/${decoded.uid}`);
    if (result.type === 'checkout_session') {
      await userRef.update({
        'planChange': {
          newPlan: requestedPlanId,
          newPlanName: planNames[requestedPlanId],
          billingCycle: requestedBilling,
          checkoutSessionId: result.checkout_session.id,
          changedAt: admin.database.ServerValue.TIMESTAMP,
          status: 'pending_payment'
        }
      });
      
      return res.status(200).json({
        success: true,
        requiresPayment: true,
        checkoutUrl: result.checkout_session.url,
        sessionId: result.checkout_session.id,
        message: 'Please complete payment to finish plan change'
      });
    } else {
      await userRef.update({
        'planChange': {
          newPlan: requestedPlanId,
          newPlanName: planNames[requestedPlanId],
          billingCycle: requestedBilling,
          subscriptionId: result.id,
          changedAt: admin.database.ServerValue.TIMESTAMP,
          status: 'active'
        }
      });
      
      return res.status(200).json({
        success: true,
        subscriptionId: result.id,
        status: result.status,
        message: 'Plan change completed successfully'
      });
    }
    
  } catch (error) {
    console.error('Execute approved plan change error:', error);
    return res.status(500).json({
      error: 'Failed to execute plan change',
      details: error.message
    });
  }
}

// Dashboard data handler function
async function handleDashboardData(req, res, decoded, userRecord, stripe, db) {
  try {
    
    // Create mapping from Stripe price IDs to plan names (used throughout this function)
    const PRICE_TO_PLAN_MAP = {
      [process.env.STRIPE_PRICE_REFRESH_FULL]: { name: 'Credit Refresh', id: 'credit-refresh', type: 'full' },
      [process.env.STRIPE_PRICE_REFRESH_MONTHLY]: { name: 'Credit Refresh', id: 'credit-refresh', type: 'monthly' },
      [process.env.STRIPE_PRICE_REFRESH_DEPOSIT]: { name: 'Credit Refresh', id: 'credit-refresh', type: 'deposit' },
      [process.env.STRIPE_PRICE_REBUILD_FULL]: { name: 'Credit Rebuild', id: 'credit-rebuild', type: 'full' },
      [process.env.STRIPE_PRICE_REBUILD_MONTHLY]: { name: 'Credit Rebuild', id: 'credit-rebuild', type: 'monthly' },
      [process.env.STRIPE_PRICE_REBUILD_DEPOSIT]: { name: 'Credit Rebuild', id: 'credit-rebuild', type: 'deposit' },
      [process.env.STRIPE_PRICE_COUPLES_FULL]: { name: 'Couples Advantage', id: 'couples-advantage', type: 'full' },
      [process.env.STRIPE_PRICE_COUPLES_MONTHLY]: { name: 'Couples Advantage', id: 'couples-advantage', type: 'monthly' },
      [process.env.STRIPE_PRICE_COUPLES_DEPOSIT]: { name: 'Couples Advantage', id: 'couples-advantage', type: 'deposit' },
    };
    
    // Get user data from database
    const userRef = db.ref(`users/${decoded.uid}`);
    const userSnap = await userRef.get();
    const userData = userSnap.exists() ? userSnap.val() : {};

    // Get Stripe customer info and payment history
    let paymentHistory = [];
    let subscriptions = [];
    let upcomingInvoices = [];
    let currentPlan = null;

    // First check if user has a current plan stored in Firebase
    const currentPlanRef = db.ref(`users/${decoded.uid}/currentPlan`);
    const currentPlanSnap = await currentPlanRef.get();
    if (currentPlanSnap.exists()) {
      currentPlan = currentPlanSnap.val();
    }

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

        // Format payment history with error handling
        paymentHistory = charges.data.map(charge => {
          let createdDate;
          try {
            createdDate = new Date(charge.created * 1000).toISOString();
          } catch (e) {
            console.warn('Invalid charge created timestamp:', charge.created);
            createdDate = new Date().toISOString(); // fallback to current time
          }
          
          return {
            id: charge.id,
            amount: charge.amount / 100, // Convert from cents
            currency: charge.currency.toUpperCase(),
            status: charge.status,
            description: charge.description || 'Payment',
            created: createdDate,
            receiptUrl: charge.receipt_url
          };
        });

        // If no currentPlan from Firebase, determine from active Stripe subscriptions
        if (!currentPlan && subscriptions.length > 0) {
          const activeSubscription = subscriptions.find(sub => sub.status === 'active');
          if (activeSubscription) {
            let currentPeriodEnd;
            try {
              currentPeriodEnd = new Date(activeSubscription.current_period_end * 1000).toISOString();
            } catch (e) {
              console.warn('Invalid subscription period end:', activeSubscription.current_period_end);
              currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now
            }
            
            // Map Stripe price ID to actual plan name
            const currentPriceId = activeSubscription.items.data[0]?.price?.id;
            let planName = 'Unknown Plan';
            let planId = null;
            
            if (currentPriceId && PRICE_TO_PLAN_MAP[currentPriceId]) {
              const planInfo = PRICE_TO_PLAN_MAP[currentPriceId];
              planName = planInfo.name;
              planId = planInfo.id;
            }
            
            console.log('Determined current plan:', { priceId: currentPriceId, planName, planId });
            
            currentPlan = {
              id: activeSubscription.id,
              status: activeSubscription.status,
              currentPeriodEnd: currentPeriodEnd,
              plan: planName,
              planId: planId,
              priceId: currentPriceId
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
        joinDate: userRecord.metadata.creationTime // This is already an ISO string
      },
      currentPlan,
      paymentHistory: paymentHistory.sort((a, b) => {
        try {
          return new Date(b.created).getTime() - new Date(a.created).getTime();
        } catch (e) {
          return 0; // Keep original order if dates are invalid
        }
      }),
      subscriptions: subscriptions.map(sub => {
        let currentPeriodStart, currentPeriodEnd;
        try {
          currentPeriodStart = new Date(sub.current_period_start * 1000).toISOString();
        } catch (e) {
          currentPeriodStart = new Date().toISOString();
        }
        try {
          currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
        } catch (e) {
          currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        }
        
        // Map Stripe price ID to actual plan name for subscriptions too
        const subPriceId = sub.items.data[0]?.price?.id;
        let subPlanName = 'Unknown Plan';
        
        if (subPriceId && PRICE_TO_PLAN_MAP[subPriceId]) {
          subPlanName = PRICE_TO_PLAN_MAP[subPriceId].name;
        }
        
        return {
          id: sub.id,
          status: sub.status,
          currentPeriodStart,
          currentPeriodEnd,
          plan: subPlanName,
          amount: sub.items.data[0]?.price?.unit_amount ? sub.items.data[0].price.unit_amount / 100 : 0
        };
      }),
      upcomingInvoices: upcomingInvoices.map(invoice => {
        let dueDate;
        try {
          dueDate = new Date(invoice.due_date * 1000).toISOString();
        } catch (e) {
          dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days from now
        }
        
        return {
          id: invoice.id,
          amount: invoice.amount_due / 100,
          currency: invoice.currency.toUpperCase(),
          dueDate,
          status: invoice.status
        };
      }),
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

    // Add pending plan change request if exists
    try {
      const planChangeRequestRef = db.ref(`planChangeRequests/${decoded.uid}`);
      const planChangeRequestSnap = await planChangeRequestRef.get();
      if (planChangeRequestSnap.exists()) {
        dashboardData.planChangeRequest = planChangeRequestSnap.val();
      }
    } catch (requestError) {
      console.warn('Error fetching plan change request:', requestError);
      // Continue without plan change request data
    }

    res.json(dashboardData);
  } catch (err) {
    console.error('Dashboard API Error:', err);
    
    // More specific error handling
    let errorType = 'UNKNOWN_ERROR';
    if (err.code === 'auth/id-token-expired') {
      errorType = 'TOKEN_EXPIRED';
    } else if (err.code === 'auth/invalid-id-token') {
      errorType = 'INVALID_TOKEN';
    } else if (err.message.includes('Firebase')) {
      errorType = 'FIREBASE_ERROR';
    } else if (err.message.includes('Stripe')) {
      errorType = 'STRIPE_ERROR';
    }
    
    res.status(500).json({ 
      error: err.message,
      type: errorType,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
}