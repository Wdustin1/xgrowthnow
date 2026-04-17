// Handles both /api/stripe/success and /api/stripe/portal
const Stripe = require('stripe');
const { getSession } = require('../../utils/session');
const { encrypt }    = require('../../utils/crypto');

module.exports = async (req, res) => {
  const url  = new URL(req.url, 'https://xgrowthnow.com');
  const path = url.pathname;

  // ── /api/stripe/success ──────────────────────────────────────────────────
  if (path.includes('success')) {
    const stripe    = Stripe(process.env.STRIPE_SECRET_KEY);
    const sessionId = url.searchParams.get('session_id');
    try {
      const cs = await stripe.checkout.sessions.retrieve(sessionId);
      if (cs.payment_status !== 'paid' && cs.status !== 'complete') {
        res.writeHead(302, { Location: '/pricing?error=payment_failed' });
        return res.end();
      }
      const userSession = getSession(req);
      if (userSession) {
        const updated   = { ...userSession, isPro: true, stripeCustomer: cs.customer, proSince: Date.now() };
        const encrypted = encrypt(JSON.stringify(updated), process.env.SESSION_SECRET);
        res.setHeader('Set-Cookie',
          `xgn_session=${encrypted}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60*60*24*7}`
        );
      }
      res.writeHead(302, { Location: '/dashboard?upgraded=1' });
      res.end();
    } catch {
      res.writeHead(302, { Location: '/pricing?error=verification_failed' });
      res.end();
    }
    return;
  }

  // ── /api/stripe/portal ───────────────────────────────────────────────────
  const session = getSession(req);
  if (!session?.stripeCustomer) {
    res.writeHead(302, { Location: '/pricing' });
    return res.end();
  }
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer:   session.stripeCustomer,
      return_url: 'https://xgrowthnow.com/dashboard',
    });
    res.writeHead(302, { Location: portal.url });
    res.end();
  } catch (e) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  }
};
