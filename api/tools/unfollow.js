const { getSession, setSession } = require('../../utils/session');

const CLIENT_ID     = process.env.TWITTER_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;

async function getValidToken(session, res) {
  // If token still valid with 5-min buffer, return as-is
  if (session.expiresAt && Date.now() < session.expiresAt - 300000) {
    return session.accessToken;
  }
  // Token expired or expiring — try to refresh
  if (!session.refreshToken) return session.accessToken; // can't refresh, try anyway
  try {
    const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const r = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: session.refreshToken })
    });
    const tokens = await r.json();
    if (!tokens.access_token) return session.accessToken; // refresh failed, try old token
    // Update session cookie with new tokens
    const updated = { ...session, accessToken: tokens.access_token, refreshToken: tokens.refresh_token || session.refreshToken, expiresAt: Date.now() + (tokens.expires_in || 7200) * 1000 };
    setSession(res, updated);
    return tokens.access_token;
  } catch {
    return session.accessToken;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.writeHead(405);
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  const session = getSession(req);
  if (!session) {
    res.writeHead(401);
    return res.end(JSON.stringify({ error: 'Not authenticated' }));
  }

  const { userId } = session;
  const accessToken = await getValidToken(session, res);

  let body = '';
  await new Promise(resolve => {
    req.on('data', chunk => body += chunk);
    req.on('end', resolve);
  });

  let targetIds;
  try {
    targetIds = JSON.parse(body).targetIds;
  } catch {
    res.writeHead(400);
    return res.end(JSON.stringify({ error: 'Invalid request body' }));
  }

  if (!Array.isArray(targetIds) || targetIds.length === 0) {
    res.writeHead(400);
    return res.end(JSON.stringify({ error: 'No target IDs provided' }));
  }

  const batch   = targetIds.slice(0, 50);
  const results = { success: [], failed: [] };

  for (const targetId of batch) {
    try {
      const r = await fetch(
        `https://api.twitter.com/2/users/${userId}/following/${targetId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const data = await r.json();
      if (data.data?.following === false) {
        results.success.push(targetId);
      } else {
        results.failed.push({ id: targetId, status: r.status, error: data?.detail || data?.errors?.[0]?.message || JSON.stringify(data) });
      }
      await new Promise(r => setTimeout(r, 300));
    } catch {
      results.failed.push(targetId);
    }
  }

  res.end(JSON.stringify(results));
};
