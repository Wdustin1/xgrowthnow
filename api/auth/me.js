const { getSession } = require('../../utils/session');

// Super users — always Pro, no paywall, ever
const SUPER_USER_IDS      = new Set(['2809091962']);
const SUPER_USER_HANDLES  = new Set(['investwithdoc']);

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const session = getSession(req);
  if (!session) {
    res.writeHead(401);
    return res.end(JSON.stringify({ error: 'Not authenticated' }));
  }
  const { accessToken, refreshToken, expiresAt, ...safe } = session;
  // Founder bypass — match by ID or username
  const isSuper = SUPER_USER_IDS.has(String(safe.userId))
               || SUPER_USER_HANDLES.has((safe.username || '').toLowerCase());
  if (isSuper) safe.isPro = true;
  res.end(JSON.stringify({ user: safe }));
};
