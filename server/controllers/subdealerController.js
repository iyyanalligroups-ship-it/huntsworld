const SubDealer = require("../models/subdealerModel");
const bcrypt = require("bcryptjs");
const Address=require("../models/addressModel");
const mongoose=require('mongoose');

exports.getAllSubDealers = async (req, res) => {
  try {
    const { search = '', dateFilter, merchant_id, page = 1, limit = 10 } = req.query;

    // Parse pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Use aggregation for optimized querying and pagination
    const pipeline = [];

    const matchStage = {};

    // Search by company_name (case-insensitive)
    if (search.trim()) {
      matchStage.company_name = { $regex: search.trim(), $options: 'i' }; // ⚠️ still non-indexed
    }

    // Filter by valid merchant_id
    if (merchant_id && mongoose.Types.ObjectId.isValid(merchant_id)) {
      matchStage.merchant_id = new mongoose.Types.ObjectId(merchant_id);
    }

    // Date filtering
    if (dateFilter) {
      const now = new Date();
      let startDate;

      if (dateFilter === 'today') {
        startDate = new Date(now.setHours(0, 0, 0, 0));
      } else if (dateFilter === 'week') {
        const day = now.getDay(); // 0 = Sunday
        startDate = new Date(now.setDate(now.getDate() - day));
        startDate.setHours(0, 0, 0, 0);
      } else if (dateFilter === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      if (startDate) {
        matchStage.createdAt = { $gte: startDate };
      }
    }

    // Add $match stage
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Lookup address (optional: only if you need address details)
    pipeline.push({
      $lookup: {
        from: 'addresses',
        localField: 'address_id',
        foreignField: '_id',
        as: 'address',
      },
    });

    // Flatten address if needed
    pipeline.push({ $unwind: { path: '$address', preserveNullAndEmptyArrays: true } });

    // Count stage for pagination metadata
    const facetStage = {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limitNum }
        ],
        pagination: [
          { $count: 'total' }
        ]
      }
    };

    pipeline.push(facetStage);

    const result = await SubDealer.aggregate(pipeline);

    const subDealers = result[0].data;
    const total = result[0].pagination[0]?.total || 0;

    return res.status(200).json({
      success: true,
      data: subDealers,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error('Get SubDealers Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};


exports.getSubDealerById = async (req, res) => {
  try {
    const subdealer = await SubDealer.findById(req.params.id);
    if (!subdealer) return res.status(404).json({ error: "SubDealer not found" });

    res.status(200).json(subdealer);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};


// exports.createSubDealer = async (req, res) => {
//   try {
//     const { email, phone_number, password, gst_number, pan, aadhar } = req.body;

//     // Check for existing email, GST, PAN, Aadhar
//     const existingSubDealer = await SubDealer.findOne({ 
//       $or: [{ email }, { gst_number }, { pan }, { aadhar }] 
//     });

//     if (existingSubDealer) {
//       return res.status(400).json({ error: "Email, GST, PAN, or Aadhar already exists" });
//     }

//     // Hash password before saving
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const newSubDealer = await SubDealer.create({ ...req.body, password: hashedPassword });
//     res.status(201).json(newSubDealer);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };


exports.createSubDealer = async (req, res) => {
  try {
    const {
      user_id,
      merchant_id,
      company_email,
      company_phone_number,
      company_name,
      gst_number,
      pan,
      aadhar,
      company_type,
      company_logo,
      company_images,
      description,
      msme_certificate_number,
      number_of_employees,
      year_of_establishment,
      address_line_1,
      address_line_2,
      city,
      state,
      country,
      pincode,
    } = req.body;

    // 🔹 Step 1: Create address
    const address = await Address.create({
      user_id,
      entity_type: "sub-dealer",
      address_type: "company",
      address_line_1,
      address_line_2,
      city,
      state,
      country,
      pincode,
    });

    // 🔹 Step 2: Create sub-dealer
    const subDealer = await SubDealer.create({
      user_id,
      merchant_id,
      address_id: address._id,
      company_email,
      company_phone_number,
      company_name,
      gst_number,
      pan,
      aadhar,
      company_type,
      company_logo,
      company_images,
      description,
      msme_certificate_number,
      number_of_employees,
      year_of_establishment,
    });

    return res.status(201).json({
      success: true,
      message: "Sub Dealer created successfully",
      data: subDealer,
    });
  } catch (error) {
    console.error("Create SubDealer Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create Sub Dealer",
      error: error.message,
    });
  }
};


exports.updateSubDealer = async (req, res) => {
  try {
    // Prevent password update directly (use separate route for password change)
    if (req.body.password) delete req.body.password;

    const updatedSubDealer = await SubDealer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedSubDealer) return res.status(404).json({ error: "SubDealer not found" });

    res.status(200).json(updatedSubDealer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


exports.deleteSubDealer = async (req, res) => {
  try {
    const deletedSubDealer = await SubDealer.findByIdAndDelete(req.params.id);
    if (!deletedSubDealer) return res.status(404).json({ error: "SubDealer not found" });

    res.status(200).json({ message: "SubDealer deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
