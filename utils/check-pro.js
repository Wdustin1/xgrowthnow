// Middleware helper — returns { session, isPro } or redirects
const { getSession } = require('../../utils/session');

module.exports = function checkPro(req, res) {
  const session = getSession(req);
  if (!session) {
    res.writeHead(302, { Location: '/api/auth/login' });
    res.end();
    return null;
  }
  if (!session.isPro) {
    res.writeHead(302, { Location: '/pricing' });
    res.end();
    return null;
  }
  return session;
};
