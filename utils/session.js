const { encrypt, decrypt } = require('./crypto');

const COOKIE_NAME = 'xgn_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((acc, c) => {
    const eq = c.indexOf('=');
    if (eq < 0) return acc;
    const key = c.slice(0, eq).trim();
    const val = c.slice(eq + 1).trim();
    acc[key] = decodeURIComponent(val);
    return acc;
  }, {});
}

function getSession(req) {
  const secret = process.env.SESSION_SECRET;
  const cookies = parseCookies(req.headers.cookie);
  const raw = cookies[COOKIE_NAME];
  if (!raw) return null;
  try {
    const json = decrypt(raw, secret);
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function setSession(res, data) {
  const secret = process.env.SESSION_SECRET;
  const encrypted = encrypt(JSON.stringify(data), secret);
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=${encrypted}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE}`
  );
}

function clearSession(res) {
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
  );
}

module.exports = { getSession, setSession, clearSession, parseCookies };
