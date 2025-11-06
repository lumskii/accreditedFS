import Stripe from "stripe";
import* as admin from "firebase-admin";

export const config = {
  api: {
    bodyParser: false, // Needed for raw body
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//Initialize Friebase Admin only once
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.VITE_FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.VITE_FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
    databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  });
}

const db = admin.database();

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature');

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Accept only POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
    }

  // CORS for dashboard/testing origin
  const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || 'https://accreditedfs.web.app'
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)

  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err) {
    console.error("⚠️  Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Handle successful checkout
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Extract useful info
    // Idempotency: use session.id as key under payments_by_session
    const sessionId = session.id;
    try {
      // Find user by stripe customer id
      const customerId = session.customer;
      let uid = null;
      if (customerId) {
        const snapshot = await db.ref('users').orderByChild('stripe/customerId').equalTo(customerId).once('value');
        const users = snapshot.val();
        if (users) {
          uid = Object.keys(users)[0];
        }
      }

      const record = {
        email: session.customer_details?.email || session.customer_email,
        amount_total: session.amount_total / 100,
        currency: session.currency,
        plan: session.metadata?.plan || 'unknown',
        mode: session.metadata?.mode || session.mode,
        status: 'paid',
        createdAt: Date.now(),
        sessionId,
      };

      // write to a payments_by_session node to avoid duplicates
      const existing = await db.ref(`payments_by_session/${sessionId}`).get();
      if (!existing.exists()) {
        await db.ref(`payments_by_session/${sessionId}`).set(record);
        if (uid) {
          await db.ref(`users/${uid}/payments/${sessionId}`).set(record);
          
          // For monthly mode with setup_fee_only, create a subscription starting in 30 days
          if (session.metadata?.mode === 'monthly' && session.metadata?.setup_fee_only === 'true') {
            const monthlyPriceId = session.metadata.monthly_price_id;
            if (monthlyPriceId) {
              try {
                // Calculate billing cycle start: 30 days from now
                const thirtyDaysFromNow = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
                
                // Create subscription with first billing in 30 days
                const subscription = await stripe.subscriptions.create({
                  customer: customerId,
                  items: [{ price: monthlyPriceId }],
                  billing_cycle_anchor: thirtyDaysFromNow,
                  proration_behavior: 'none',
                  metadata: {
                    plan: session.metadata.plan,
                    mode: 'monthly',
                    setup_session_id: sessionId
                  }
                });
                
                console.log('✅ Subscription created:', subscription.id, 'starting', new Date(thirtyDaysFromNow * 1000).toISOString());
                
                // Update user's current plan with subscription info
                const planName = session.metadata?.plan || 'unknown';
                const currentPlan = {
                  id: subscription.id,
                  subscriptionId: subscription.id,
                  name: planName,
                  plan: planName, // Add this field for Dashboard compatibility
                  status: 'active',
                  mode: 'monthly',
                  purchasedAt: new Date().toISOString(),
                  setupFeeAmount: session.amount_total / 100,
                  setupSessionId: sessionId,
                  currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
                  currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
                  nextBillingDate: new Date(thirtyDaysFromNow * 1000).toISOString()
                };
                
                await db.ref(`users/${uid}/currentPlan`).set(currentPlan);
                console.log('✅ Current plan updated for user', uid, 'with subscription', subscription.id);
              } catch (subErr) {
                console.error('❌ Failed to create subscription:', subErr);
                // Still set a basic plan record so user has access
                await db.ref(`users/${uid}/currentPlan`).set({
                  id: sessionId,
                  name: session.metadata.plan,
                  plan: session.metadata.plan, // Add this field for Dashboard compatibility
                  status: 'paid',
                  mode: 'monthly',
                  purchasedAt: new Date().toISOString(),
                  setupFeeAmount: session.amount_total / 100,
                  error: 'subscription_creation_failed'
                });
              }
            }
          } else {
            // Full payment mode - just update the plan
            const planName = session.metadata?.plan || 'unknown';
            const currentPlan = {
              id: sessionId,
              name: planName,
              plan: planName, // Add this field for Dashboard compatibility
              status: 'paid',
              mode: session.metadata?.mode || session.mode,
              purchasedAt: new Date().toISOString(),
              amount: session.amount_total / 100,
              currency: session.currency
            };
            
            await db.ref(`users/${uid}/currentPlan`).set(currentPlan);
            console.log('✅ Current plan updated for user', uid, 'to', planName);
          }
        } else {
          await db.ref(`payments_orphans/${sessionId}`).set(record);
        }
        console.log('✅ Payment saved for session', sessionId);
      } else {
        console.log('⚠️ Duplicate webhook received for session', sessionId);
      }
    } catch (dbErr) {
      console.error('❌ Failed to save payment:', dbErr);
    }
  }

  res.json({ received: true });
}