const Stripe = require('stripe');
const { getSession, setSession } = require('../../utils/session');

module.exports = async (req, res) => {
  const session = getSession(req);
  if (!session) {
    res.writeHead(302, { Location: '/api/auth/login' });
    return res.end();
  }

  const stripe   = Stripe(process.env.STRIPE_SECRET_KEY);
  const priceId  = 'price_1TBKm0PkFtIFpkReQaU6iVxY';
  const baseUrl  = 'https://xgrowthnow.com';

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode:                 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}/pricing`,
      client_reference_id: session.userId,
      customer_email:      session.email || undefined,
      metadata: {
        userId:   session.userId,
        username: session.username,
      },
    });

    res.writeHead(302, { Location: checkoutSession.url });
    res.end();
  } catch (e) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  }
};
