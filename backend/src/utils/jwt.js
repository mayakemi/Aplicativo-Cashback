const jwt = require('jsonwebtoken');
const { getEnv } = require('../config/env');

// Para não quebrar importação durante build/smoke-test.
// Em produção, certifique-se de definir `JWT_SECRET` no ambiente.
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = getEnv('JWT_EXPIRES_IN', '1d');

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
};

