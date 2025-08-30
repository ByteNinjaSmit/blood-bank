const jwt = require("jsonwebtoken");
const User = require("../models/user-model");

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization");
  const coockieToken = req.cookies?.authToken;

  if (!token) {
    return res
      .status(401)
      .json({ message: " token Unauthorized. Token not provided" });
  }
  if (!coockieToken) {
    return res
      .status(401)
      .json({ message: " coockieToken Unauthorized. Token not provided" });
  }

  
  const jwtToken = token.replace("Bearer", "").trim();
  
  if(jwtToken !== coockieToken){
        return res
      .status(401)
      .json({ message: "Unauthorized. Token not provided" });
  }
  try {

    const isVerified = jwt.verify(jwtToken, process.env.JWT_SECRET_KEY);
    const { userID } = isVerified;

    const userData = await User.findById({ _id: userID }).select("-password");

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = userData;
    req.token = token;
    req.userID = userData._id;

    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).json({ message: "Unauthorized. Invalid Token." });
  }
};

module.exports = authMiddleware;
