// Ensure only admins can access certain routes
module.exports = function adminMiddleware(req, res, next) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
  } catch (e) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
}
