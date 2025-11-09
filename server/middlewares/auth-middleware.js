const jwt = require("jsonwebtoken");
const User = require("../models/user-model");

const authMiddleware = async (req, res, next) => {
  const auth = req.header("Authorization");
  if (!auth) {
    return res.status(401).json({ message: "Unauthorized. Token not provided" });
  }
  const jwtToken = auth.replace("Bearer", "").trim();
  try {
    const isVerified = jwt.verify(jwtToken, process.env.JWT_SECRET_KEY);
    const { userID } = isVerified;
    const userData = await User.findById({ _id: userID }).select("-password");
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }
    req.user = userData;
    req.token = jwtToken;
    req.userID = userData._id;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized. Invalid Token." });
  }
};

module.exports = authMiddleware;
