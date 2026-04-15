// controllers/distributor.controller.js
const User = require("../models/userModel");
const Role = require("../models/roleModel");
const Merchant = require("../models/MerchantModel");
const GrocerySeller = require("../models/grocerySellerModel");
const CompanyType = require("../models/companyTypeModel");
const DistributorRequest = require("../models/distributionRequestModel");
const Address = require("../models/addressModel"); // Import the Address model

// controllers/distributor.controller.js
const mongoose = require('mongoose');
// exports.searchEntities = async (req, res) => {
//   try {
//     const { query, type } = req.query; // type: 'parent' or 'child'
//     const searchRegex = new RegExp(query, 'i');

//     // 1. Search Users first
//     const users = await User.find({
//       $or: [
//         { name: searchRegex },
//         { email: searchRegex },
//         { phone: searchRegex },
//         { user_code: searchRegex }
//       ]
//     }).populate('role');

//     const results = [];

//     for (let user of users) {
//       const roleName = user.role.role;

//       if (type === 'parent') {
//         // Only Manufacturers
//         if (roleName === 'MERCHANT') {
//           const merchantData = await Merchant.findOne({ user_id: user._id }).populate('company_type');
//           if (merchantData?.company_type?.displayName?.toLowerCase() === 'manufacturer') {
//             results.push({ user, details: merchantData, type: 'Manufacturer' });
//           }
//         }
//       } else {
//         // Children: Grocery Sellers OR Non-Manufacturer Merchants
//         if (roleName === 'GROCERY_SELLER') {
//           const groceryData = await GrocerySeller.findOne({ user_id: user._id });
//           results.push({ user, details: groceryData, type: 'Grocery Seller' });
//         } else if (roleName === 'MERCHANT') {
//           const merchantData = await Merchant.findOne({ user_id: user._id }).populate('company_type');
//           if (merchantData?.company_type?.displayName?.toLowerCase() !== 'manufacturer') {
//             results.push({ user, details: merchantData, type: 'Merchant' });
//           }
//         }
//       }
//     }
//     res.json(results);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.sendRequest = async (req, res) => {
//   const { manufacturerId, childIds, adminId } = req.body;

//   try {
//     if (!manufacturerId || !childIds || !Array.isArray(childIds) || childIds.length === 0) {
//       return res.status(400).json({ message: "Missing required data." });
//     }

//     const results = [];

//     for (const childId of childIds) {
//       // Check if a relationship exists in EITHER direction to prevent loops
//       const existingActive = await DistributorRequest.findOne({
//         $or: [
//           { manufacturer_id: manufacturerId, child_id: childId },
//           { manufacturer_id: childId, child_id: manufacturerId }
//         ],
//         status: { $in: ['pending', 'accepted'] }
//       });

//       if (existingActive) continue;

//       const updatedReq = await DistributorRequest.findOneAndUpdate(
//         { manufacturer_id: manufacturerId, child_id: childId },
//         {
//           initiated_by: adminId,
//           status: 'pending',
//           $set: { updatedAt: new Date() }
//         },
//         { upsert: true, new: true }
//       );
//       results.push(updatedReq);
//     }

//     if (results.length === 0) {
//       return res.status(400).json({ message: "A connection already exists or is pending." });
//     }

//     res.status(201).json({ message: "Requests sent successfully", count: results.length });
//   } catch (err) {
//     res.status(500).json({ message: "Failed to process requests", error: err.message });
//   }
// };

// controllers/distributor.controller.js

exports.getMerchantRequests = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }

    // Find requests where current user is EITHER the manufacturer OR the child
    const requests = await DistributorRequest.find({
      $or: [
        { child_id: userId },
        { manufacturer_id: userId }
      ]
    })
      .populate('manufacturer_id', 'name email user_code') // Populate Parent
      .populate('child_id', 'name email user_code')        // Populate Child
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};



exports.getMyRequests = async (req, res) => {
  try {
    const { userId } = req.params;

    const requests = await DistributorRequest.find({
      $or: [{ child_id: userId }, { manufacturer_id: userId }]
    })
      .populate('manufacturer_id', 'name email user_code role')
      .populate('child_id', 'name email user_code role')
      .sort({ createdAt: -1 });

    const enrichedRequests = await Promise.all(requests.map(async (doc) => {
      const reqObj = doc.toObject();
      // Determine who the other person is
      const isParentSide = String(reqObj.manufacturer_id?._id) === String(userId);
      const partnerUser = isParentSide ? reqObj.child_id : reqObj.manufacturer_id;

      if (partnerUser) {
        // 1. Get Business Details (Merchant or Grocery Seller)
        let details = await Merchant.findOne({ user_id: partnerUser._id }).populate('company_type');
        if (!details) {
          details = await GrocerySeller.findOne({ user_id: partnerUser._id }).populate('member_type');
        }

        // 2. Get Address Details using robust lookup
        const addresses = await Address.find({ user_id: partnerUser._id }).lean();
        const primaryAddress = addresses.find(a => a.address_type === 'company')
          || addresses.find(a => a.entity_type === 'grocery_seller')
          || addresses[0]
          || null;

        // 3. Attach everything to the partner object
        partnerUser.businessDetails = details;
        partnerUser.addressDetails = primaryAddress;
        partnerUser.addresses = addresses; // Include full list for modals
      }

      return reqObj;
    }));

    res.status(200).json(enrichedRequests);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

exports.sendRequest = async (req, res) => {
  const { manufacturerId, childIds, adminId, partnership_type } = req.body;

  try {
    if (!manufacturerId || !childIds || !Array.isArray(childIds) || childIds.length === 0) {
      return res.status(400).json({ message: "Missing required data." });
    }

    const results = [];
    for (const childId of childIds) {
      const existingActive = await DistributorRequest.findOne({
        $or: [
          { manufacturer_id: manufacturerId, child_id: childId },
          { manufacturer_id: childId, child_id: manufacturerId }
        ],
        status: { $in: ['pending', 'accepted'] }
      });

      if (existingActive) continue;

      const updatedReq = await DistributorRequest.findOneAndUpdate(
        { manufacturer_id: manufacturerId, child_id: childId },
        {
          initiated_by: adminId,
          status: 'pending',
          partnership_type: partnership_type || 'distributor',
          isReadByRecipient: false,
          $set: { updatedAt: new Date() }
        },
        { upsert: true, new: true }
      );
      results.push(updatedReq);

      // Broadcast to target user
      const merchantSocketHelpers = req.app.get("merchantSocketHelpers");
      if (merchantSocketHelpers) {
          // If admin sent it, notify both manufacturer and child?
          // Usually in this case childId is the target if manufacturer is provided
          merchantSocketHelpers.broadcastToUser(childId);
          if (manufacturerId !== adminId) {
             merchantSocketHelpers.broadcastToUser(manufacturerId);
          }
      }
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "A connection already exists or is pending." });
    }

    res.status(201).json({ message: "Requests sent successfully", count: results.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to process requests", error: err.message });
  }
};

exports.respondToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, partnership_type, userId } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status update" });
    }

    const request = await DistributorRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const updateData = { status };

    // PERMISSION CHECK: Only the Parent (Manufacturer) can change the type
    const isParent = String(request.manufacturer_id) === String(userId);
    if (partnership_type && isParent) {
      updateData.partnership_type = partnership_type;
    }

    const updatedRequest = await DistributorRequest.findByIdAndUpdate(
      requestId,
      updateData,
      { new: true }
    ).populate('manufacturer_id', 'name').populate('child_id', 'name');

    // Broadcast updates to both sides
    const merchantSocketHelpers = req.app.get("merchantSocketHelpers");
    if (merchantSocketHelpers) {
        if (updatedRequest.manufacturer_id) merchantSocketHelpers.broadcastToUser(updatedRequest.manufacturer_id._id || updatedRequest.manufacturer_id);
        if (updatedRequest.child_id) merchantSocketHelpers.broadcastToUser(updatedRequest.child_id._id || updatedRequest.child_id);
    }

    res.status(200).json({
      message: `You have ${status} the invitation`,
      data: updatedRequest
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};
// controllers/distributor.controller.js

exports.searchEntities = async (req, res) => {
  try {
    const { query, type } = req.query; // type: 'parent' or 'child'
    const searchRegex = new RegExp(query, 'i');

    const users = await User.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { user_code: searchRegex }
      ]
    }).populate('role');

    const results = [];

    for (let user of users) {
      const roleName = user.role?.role;
      let details = null;
      let entityType = '';

      if (type === 'parent') {
        // Looking for Manufacturers
        if (roleName === 'MERCHANT') {
          const merchantData = await Merchant.findOne({ user_id: user._id }).populate('company_type');
          if (merchantData?.company_type?.displayName?.toLowerCase() === 'manufacturer') {
            details = merchantData;
            entityType = 'Manufacturer';
          }
        }
      } else {
        // Looking for Children: Grocery Sellers OR Merchants
        if (roleName === 'GROCERY_SELLER') {
          details = await GrocerySeller.findOne({ user_id: user._id });
          entityType = 'Grocery Seller';
        } else if (roleName === 'MERCHANT') {
          const merchantData = await Merchant.findOne({ user_id: user._id }).populate('company_type');
          const isManufacturer = merchantData?.company_type?.displayName?.toLowerCase() === 'manufacturer';
          details = merchantData;
          entityType = isManufacturer ? 'Manufacturer Partner' : 'Merchant Distributor';
        }
      }

      if (details) {
        // Fetch all addresses for this user
        const addresses = await Address.find({ user_id: user._id });
        
        results.push({
          user,
          details,
          addresses,
          type: entityType
        });
      }
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await DistributorRequest.find()
      .populate('manufacturer_id', 'name user_code')
      .populate('child_id', 'name user_code')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Error fetching records" });
  }
};

exports.deleteRequest = async (req, res) => {
  try {
    await DistributorRequest.findByIdAndDelete(req.params.id);
    res.json({ message: "Record deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete record" });
  }
};

// controllers/distributor.controller.js

exports.deleteRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;

    // 1. Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid Request ID" });
    }

    // 2. Find and delete the document
    const deletedRequest = await DistributorRequest.findByIdAndDelete(requestId);

    if (!deletedRequest) {
      return res.status(404).json({ message: "Request record not found" });
    }

    // 3. Success response
    res.status(200).json({
      success: true,
      message: "Relationship record deleted successfully"
    });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message
    });
  }
};



exports.getMerchantPartnershipRole = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Find the User and their Role
    const user = await User.findById(userId).populate("role");
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. If role is not MERCHANT, they are automatically a 'child' (e.g. Grocery Seller)
    if (user.role?.role !== 'MERCHANT') {
      return res.json({ role: 'child', typeName: 'distributor' });
    }

    // 3. Deep dive into Merchant Details to find the Company Type name
    const merchant = await Merchant.findOne({ user_id: userId })
      .populate('company_type', 'displayName');

    if (!merchant || !merchant.company_type) {
      return res.json({ role: 'child', typeName: 'merchant' });
    }

    // 4. Check if the display name is "Manufacturer"
    const isManufacturer = merchant.company_type.displayName?.toLowerCase() === 'manufacturer';

    res.json({
      role: isManufacturer ? 'parent' : 'child',
      typeName: merchant.company_type.displayName
    });

  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// controllers/distributor.controller.js
// exports.getWebsiteNetwork = async (req, res) => {
//   try {
//     const { merchantId } = req.params;
//     const network = await DistributorRequest.find({
//       manufacturer_id: merchantId,
//       status: 'accepted'
//     })
//     .populate('child_id', 'name email user_code role')
//     .sort({ createdAt: -1 });

//     const distributors = [];
//     const suppliers = [];

//     for (let item of network) {
//       const partner = item.child_id;
//       if (!partner) continue;

//       let biz = await Merchant.findOne({ user_id: partner._id }).populate('company_type');
//       if (!biz) biz = await GrocerySeller.findOne({ user_id: partner._id });
//       const addr = await Address.findOne({ user_id: partner._id, address_type: 'company' });

//       const enriched = {
//         ...partner.toObject(),
//         businessDetails: biz,
//         addressDetails: addr
//       };

//       if (item.partnership_type === 'supplier') {
//         suppliers.push(enriched);
//       } else {
//         distributors.push(enriched);
//       }
//     }
//     res.status(200).json({ distributors, suppliers });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
// controllers/distributor.controller.js

exports.getWebsiteNetwork = async (req, res) => {
  try {
    const { merchantId } = req.params;

    // Find ALL accepted relationships involving this merchant
    const network = await DistributorRequest.find({
      $or: [
        { manufacturer_id: merchantId },
        { child_id: merchantId }
      ],
      status: 'accepted'
    })
      .populate('manufacturer_id', 'name email user_code role')
      .populate('child_id', 'name email user_code role')
      .sort({ createdAt: -1 });

    const distributors = [];
    const suppliers = [];

    for (let item of network) {
      // Logic: Determine if the 'other' person is a supplier or distributor
      const isUserParent = String(item.manufacturer_id._id) === String(merchantId);

      // The partner is the opposite of the current merchantId
      const partner = isUserParent ? item.child_id : item.manufacturer_id;
      if (!partner) continue;

      // Fetch Business & Address details for the partner
      let biz = await Merchant.findOne({ user_id: partner._id }).populate('company_type');
      if (!biz) biz = await GrocerySeller.findOne({ user_id: partner._id }).populate('member_type');
      
      const addresses = await Address.find({ user_id: partner._id }).lean();
      const primaryAddress = addresses.find(a => a.address_type === 'company')
        || addresses.find(a => a.entity_type === 'grocery_seller')
        || addresses[0]
        || null;

      const enrichedPartner = {
        ...partner.toObject(),
        businessDetails: biz,
        addressDetails: primaryAddress,
        addresses: addresses, // Include full list for modals
        relationshipId: item._id
      };

      /**
       * BIDIRECTIONAL LOGIC:
       * 1. If I am the Parent (Manufacturer), the partner is my DISTRIBUTOR.
       * 2. If I am the Child, the partner is my SUPPLIER.
       */
      if (isUserParent) {
        distributors.push(enrichedPartner);
      } else {
        suppliers.push(enrichedPartner);
      }
    }

    res.status(200).json({ distributors, suppliers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAsRead = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user.userId;

        const updated = await DistributorRequest.findOneAndUpdate(
            { 
              _id: requestId,
              $or: [{ manufacturer_id: userId }, { child_id: userId }],
              initiated_by: { $ne: userId }
            },
            { isReadByRecipient: true },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Request not found or not recipient.' });
        }

        const merchantSocketHelpers = req.app.get("merchantSocketHelpers");
        if (merchantSocketHelpers) {
            merchantSocketHelpers.broadcastToUser(userId);
        }

        return res.status(200).json({ success: true, message: 'Marked as read.' });
    } catch (error) {
        console.error('Error marking as read:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;

        await DistributorRequest.updateMany(
            { 
                $or: [{ manufacturer_id: userId }, { child_id: userId }],
                initiated_by: { $ne: userId },
                status: 'pending',
                isReadByRecipient: { $ne: true }
            },
            { isReadByRecipient: true }
        );

        const merchantSocketHelpers = req.app.get("merchantSocketHelpers");
        if (merchantSocketHelpers) {
            merchantSocketHelpers.broadcastToUser(userId);
        }

        return res.status(200).json({ success: true, message: 'All marked as read.' });
    } catch (error) {
        console.error('Error marking all as read:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};