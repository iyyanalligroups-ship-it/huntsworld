const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
dotenv.config();


exports.authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    if (!verified.userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.user = verified; // req.user.userId will now work
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
