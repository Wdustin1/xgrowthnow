const { clearSession } = require('../../utils/session');

module.exports = (req, res) => {
  clearSession(res);
  res.writeHead(302, { Location: '/' });
  res.end();
};
