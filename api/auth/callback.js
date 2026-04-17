const { decrypt } = require('../../utils/crypto');
const { parseCookies } = require('../../utils/session');
const { encrypt } = require('../../utils/crypto');

module.exports = async (req, res) => {
  const secret       = process.env.SESSION_SECRET;
  const clientId     = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  const callback     = 'https://xgrowthnow.com/api/auth/callback';

  try {
    const url    = new URL(req.url, 'https://xgrowthnow.com');
    const code   = url.searchParams.get('code');
    const state  = url.searchParams.get('state');
    const error  = url.searchParams.get('error');

    if (error) {
      return redirect(res, `/dashboard?error=denied&reason=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return redirect(res, '/dashboard?error=missing_params');
    }

    // Recover PKCE data from cookie
    const cookies = parseCookies(req.headers.cookie || '');
    const pkceRaw = cookies['xgn_pkce'];

    if (!pkceRaw) {
      return redirect(res, '/dashboard?error=no_pkce_cookie');
    }

    let pkceData;
    try {
      const decrypted = decrypt(pkceRaw, secret);
      if (!decrypted) return redirect(res, '/dashboard?error=pkce_decrypt_failed');
      pkceData = JSON.parse(decrypted);
    } catch (e) {
      return redirect(res, '/dashboard?error=pkce_parse_failed');
    }

    if (pkceData.state !== state) {
      return redirect(res, '/dashboard?error=state_mismatch');
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        Authorization:   'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      body: new URLSearchParams({
        code,
        grant_type:    'authorization_code',
        redirect_uri:  callback,
        code_verifier: pkceData.codeVerifier,
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      const errMsg = tokens.error || tokens.error_description || JSON.stringify(tokens);
      return redirect(res, `/dashboard?error=token_failed&reason=${encodeURIComponent(errMsg)}`);
    }

    // Get user profile
    const userRes = await fetch(
      'https://api.twitter.com/2/users/me?user.fields=name,username,profile_image_url,public_metrics',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    const userData = await userRes.json();

    if (!userData.data) {
      return redirect(res, '/dashboard?error=profile_failed');
    }

    const user = userData.data;

    // Build session data
    const sessionData = {
      accessToken:  tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      userId:       user.id,
      username:     user.username,
      name:         user.name,
      avatar:       (user.profile_image_url || '').replace('_normal', '_400x400'),
      followers:    user.public_metrics?.followers_count || 0,
      following:    user.public_metrics?.following_count || 0,
      expiresAt:    Date.now() + (tokens.expires_in || 7200) * 1000,
    };

    // Encrypt session into cookie
    const COOKIE_NAME = 'xgn_session';
    const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
    const encryptedSession = encrypt(JSON.stringify(sessionData), secret);

    // Set both cookies (session + clear PKCE) in one header
    res.setHeader('Set-Cookie', [
      `${COOKIE_NAME}=${encryptedSession}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE}`,
      'xgn_pkce=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
    ]);

    redirect(res, pkceData.returnTo || '/dashboard');

  } catch (e) {
    redirect(res, `/dashboard?error=exception&reason=${encodeURIComponent(e.message)}`);
  }
};

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}
