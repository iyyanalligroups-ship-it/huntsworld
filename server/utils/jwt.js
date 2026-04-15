const jwt = require("jsonwebtoken");

exports.generateAuthToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role?.role || "USER",
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
