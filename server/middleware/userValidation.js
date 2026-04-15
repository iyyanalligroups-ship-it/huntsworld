module.exports = (req, res, next) => {
  const { name, email, phone } = req.body;
  
  // Check for missing required fields
  const requiredFields = ["name", "email", "phone"];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  // Phone number validation (must be 10 digits)
  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: "Phone number must be a 10-digit number." });
  }

  next();
};
