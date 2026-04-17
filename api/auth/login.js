const crypto = require('crypto');
const { encrypt } = require('../../utils/crypto');

module.exports = (req, res) => {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const secret   = process.env.SESSION_SECRET;
  const callback = 'https://xgrowthnow.com/api/auth/callback';

  // PKCE
  const codeVerifier  = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  const state         = crypto.randomBytes(16).toString('hex');

  // Capture returnTo so we can redirect back after auth
  const url      = new URL(req.url, 'https://xgrowthnow.com');
  const returnTo = url.searchParams.get('returnTo') || '/dashboard';

  // Store verifier + state + returnTo in short-lived cookie
  const tempData = encrypt(JSON.stringify({ codeVerifier, state, returnTo }), secret);
  res.setHeader('Set-Cookie',
    `xgn_pkce=${tempData}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
  );

  const params = new URLSearchParams({
    response_type:         'code',
    client_id:             clientId,
    redirect_uri:          callback,
    scope:                 'tweet.read tweet.write users.read follows.read follows.write like.read offline.access',
    state,
    code_challenge:        codeChallenge,
    code_challenge_method: 'S256',
  });

  res.writeHead(302, { Location: `https://twitter.com/i/oauth2/authorize?${params}` });
  res.end();
};
