import Stripe from "stripe";
import * as admin from 'firebase-admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase Admin with service account from env (if not already)
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
const db = admin.database();

export default async function handler(req, res) {
  // CORS: allow the frontend origin (configured via NEXT_PUBLIC_SITE_URL)
  // Normalize origins (strip trailing slash) and allow Authorization header for preflight.
  const normalize = (u) => (u ? u.replace(/\/$/, '') : '');
  const allowedOrigins = [
    normalize(process.env.NEXT_PUBLIC_SITE_URL),
    'http://localhost:5173',
    'https://accreditedfs.vercel.app',
  ].filter(Boolean);
  const origin = normalize(req.headers.origin || '');
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    // Let caches know the response varies by origin
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
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

    let line_items = [];

    if (mode === "full") {
      line_items.push({ price: PRICE_IDS[plan].full, quantity: 1 });
    } else if (mode === "monthly") {
      line_items.push(
        { price: PRICE_IDS[plan].deposit, quantity: 1 },
        { price: PRICE_IDS[plan].monthly, quantity: 1 }
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
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cancel`,
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
    res.status(500).json({ error: err.message });
  }
}
