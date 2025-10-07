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
        mode: session.mode,
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