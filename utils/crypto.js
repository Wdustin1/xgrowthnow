const crypto = require('crypto');
const ALGO = 'aes-256-gcm';

function getKey(secret) {
  return crypto.scryptSync(secret, 'xgrowth_salt_v1', 32);
}

function encrypt(text, secret) {
  const key = getKey(secret);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

function decrypt(token, secret) {
  try {
    const key = getKey(secret);
    const data = Buffer.from(token, 'base64url');
    const iv = data.slice(0, 16);
    const tag = data.slice(16, 32);
    const encrypted = data.slice(32);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final('utf8');
  } catch {
    return null;
  }
}

module.exports = { encrypt, decrypt };
