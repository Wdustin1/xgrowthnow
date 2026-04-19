const { encrypt, decrypt } = require('./crypto');
const { parseCookies } = require('./session');

/**
 * Refreshes the Twitter access token if expired (or close to expiry).
 * Returns the updated session, and sets a new cookie on the response if refreshed.
 */
async function refreshIfNeeded(req, res, session) {
  const secret = process.env.SESSION_SECRET;
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  // If token not expired yet (with 5 min buffer), return as-is
  if (session.expiresAt && Date.now() < session.expiresAt - 5 * 60 * 1000) {
    return session;
  }

  // No refresh token — can't refresh
  if (!session.refreshToken) return session;

  try {
    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: session.refreshToken,
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) return session; // refresh failed, return old session

    // Update session with new tokens
    const updatedSession = {
      ...session,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || session.refreshToken,
      expiresAt: Date.now() + (tokens.expires_in || 7200) * 1000,
    };

    // Write updated session back to cookie
    const encrypted = encrypt(JSON.stringify(updatedSession), secret);
    res.setHeader('Set-Cookie',
      `xgn_session=${encrypted}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 30}`
    );

    return updatedSession;
  } catch (e) {
    return session; // on error, return original
  }
}

module.exports = { refreshIfNeeded };
