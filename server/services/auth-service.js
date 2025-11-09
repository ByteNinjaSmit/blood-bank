const jwt = require('jsonwebtoken');
const ms = require('ms');
const RefreshToken = require('../models/refresh-token-model');

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || '1h';

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: ACCESS_TTL });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET_KEY, { expiresIn: REFRESH_TTL });
}

async function generateTokenPair(user, ip) {
  const accessToken = signAccessToken({ userID: user._id.toString(), email: user.email, role: user.role });
  const refreshTokenValue = signRefreshToken({ userID: user._id.toString() });
  const expiresAt = new Date(Date.now() + ms(REFRESH_TTL));
  await RefreshToken.create({ userId: user._id, token: refreshTokenValue, expiresAt, createdByIp: ip });
  return { accessToken, refreshToken: refreshTokenValue };
}

async function rotateRefreshToken(oldTokenValue, userId, ip) {
  const tokenDoc = await RefreshToken.findOne({ token: oldTokenValue });
  if (!tokenDoc) throw new Error('Invalid refresh token');
  if (tokenDoc.revoked) throw new Error('Refresh token revoked');
  if (tokenDoc.isExpired()) throw new Error('Refresh token expired');
  if (tokenDoc.userId.toString() !== String(userId)) throw new Error('Refresh token user mismatch');

  // Revoke old and issue new
  const newRefreshTokenValue = signRefreshToken({ userID: userId.toString() });
  const expiresAt = new Date(Date.now() + ms(REFRESH_TTL));

  tokenDoc.revoked = true;
  tokenDoc.revokedAt = new Date();
  tokenDoc.revokedByIp = ip;
  tokenDoc.replacedByToken = newRefreshTokenValue;
  await tokenDoc.save();

  await RefreshToken.create({ userId, token: newRefreshTokenValue, expiresAt, createdByIp: ip });
  return newRefreshTokenValue;
}

async function revokeRefreshToken(tokenValue, ip) {
  const tokenDoc = await RefreshToken.findOne({ token: tokenValue });
  if (!tokenDoc) return;
  tokenDoc.revoked = true;
  tokenDoc.revokedAt = new Date();
  tokenDoc.revokedByIp = ip;
  await tokenDoc.save();
}

function setRefreshCookie(res, tokenValue) {
  // secure cookie settings
  res.cookie('refreshToken', tokenValue, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    expires: new Date(Date.now() + ms(REFRESH_TTL)),
    path: '/api/auth',
  });
}

function clearRefreshCookie(res) {
  res.clearCookie('refreshToken', { path: '/api/auth' });
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  generateTokenPair,
  rotateRefreshToken,
  revokeRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  ACCESS_TTL,
  REFRESH_TTL,
};
