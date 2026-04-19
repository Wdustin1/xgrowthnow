const { getSession } = require('../../utils/session');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const session = getSession(req);
  if (!session) return res.end(JSON.stringify({ error: 'No session' }));

  const { userId, accessToken, expiresAt } = session;
  const tokenAge = expiresAt ? Math.round((expiresAt - Date.now()) / 1000 / 60) : 'unknown';

  // Test the following endpoint directly
  const r = await fetch(
    `https://api.twitter.com/2/users/${userId}/following?max_results=10&user.fields=name`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const raw = await r.json();

  res.end(JSON.stringify({
    userId,
    tokenExpiresInMinutes: tokenAge,
    httpStatus: r.status,
    twitterResponse: raw
  }));
};
