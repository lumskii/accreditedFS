import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const { plan, mode } = req.body;

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

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
      mode: mode === "full" ? "payment" : "subscription",
      line_items,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cancel`,
    });

    res.json({ id: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}