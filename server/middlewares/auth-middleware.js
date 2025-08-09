/*
authMiddleware – Validate JWT token & attach user to request
*/

const jwt = require("jsonwebtoken");
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access token required" });

  jwt.verify(token, process.env.JWT_SECRET, (err, userData) => {
    if (err)
      return res.status(403).json({ message: "Invalid or expired token" });
    req.user = userData;
    next();
  });
};

module.exports = {
  authMiddleware,
};
