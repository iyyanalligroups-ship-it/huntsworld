const CouponName = require("../models/couponModel");

// Create a new coupon name
exports.createCouponName = async (req, res) => {
  try {
    const { coupon_name } = req.body;

    if (!coupon_name) {
      return res.status(400).json({ message: "Coupon name is required" });
    }

    const existingCoupon = await CouponName.findOne({ coupon_name });
    if (existingCoupon) {
      return res.status(400).json({ message: "Coupon name already exists" });
    }

    const coupon = new CouponName({ coupon_name });
    await coupon.save();

    res.status(201).json({success:true, message: "Coupon name created successfully", coupon });
  } catch (error) {
    res.status(500).json({success:false, message: error.message });
  }
};

// Get all coupon names
exports.getCouponNames = async (req, res) => {
  try {
    const coupons = await CouponName.find();
    res.json({
      success:true,
      message:"Fetched Coupons Successfully",
      data:coupons
    });
  } catch (error) {
    res.status(500).json({success:false, message: error.message });
  }
};

// Get coupon name by ID
exports.getCouponNameById = async (req, res) => {
  try {
    const coupon = await CouponName.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon name not found" });
    }
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update coupon name
exports.updateCouponName = async (req, res) => {
  try {
    const { coupon_name } = req.body;

    if (!coupon_name) {
      return res.status(400).json({ message: "Coupon name is required" });
    }

    const coupon = await CouponName.findByIdAndUpdate(
      req.params.id,
      { coupon_name },
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({ message: "Coupon name not found" });
    }
    res.json({ success:true, message: "Coupon name updated successfully", coupon });
  } catch (error) {
    res.status(500).json({ success:false, message: error.message });
  }
};

// Delete coupon name
exports.deleteCouponName = async (req, res) => {
  try {
    const coupon = await CouponName.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon name not found" });
    }
    res.json({ success:true, message: "Coupon name deleted successfully" });
  } catch (error) {
    res.status(500).json({success:false, message: error.message });
  }
};
