const ServiceProvider = require('../models/serviceProviderModel');
const User = require("../models/userModel");
const Address = require("../models/addressModel");
const Product = require("../models/productModel");
const Role = require('../models/roleModel'); 
const ProductAttribute = require("../models/productAttributeModel");
const assignFreePlan = require("../utils/assignFreePlan");
const { getSyncVerificationFlags } = require("../utils/verificationSync");

exports.createServiceProvider = async (req, res) => {
    try {
        const serviceProvider = new ServiceProvider({
            ...req.body,
            vehicle_images: req.body.imageUrls,
        });

        // Cross-model verification sync
        const verificationFlags = await getSyncVerificationFlags(serviceProvider.user_id, serviceProvider.company_email, serviceProvider.company_phone_number);
        serviceProvider.email_verified = verificationFlags.email_verified;
        serviceProvider.number_verified = verificationFlags.number_verified;

        await serviceProvider.save();
        res.status(201).json({
            statusCode: 201,
            success: true,
            message: 'Service Provider created successfully',
            data: serviceProvider
        });
    } catch (error) {
        res.status(400).json({
            statusCode: 400,
            success: false,
            message: error.message,
        });
    }
};

exports.getAllServiceProviders = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;

        const totalRecords = await ServiceProvider.countDocuments();
        const totalPages = Math.ceil(totalRecords / limit);

        const serviceProviders = await ServiceProvider.find()
            .populate('user_id')
            .populate('address_id')
            .skip(skip)
            .limit(limit);

        res.json({
            statusCode: 200,
            success: true,
            message: 'Service Providers fetched successfully',
            data: serviceProviders,
            pagination: {
                currentPage: page,
                totalPages,
                totalRecords,
                perPage: limit
            }
        });
    } catch (error) {
        res.status(500).json({
            statusCode: 500,
            success: false,
            message: error.message,
            data: null
        });
    }
};

exports.getServiceProviderByEmail = async (req, res) => {
    const { email, page = 1, limit = 10 } = req.query;
  
    try {
      if (!email) {
        return res.status(400).json({
          message: "Email query parameter is required.",
        });
      }
  
      // 1. Find the service provider
      const serviceProvider = await ServiceProvider.findOne({ company_email: email });
  
      if (!serviceProvider) {
        return res.json({
          message: `No service provider found with the email: ${email}. Please verify and try again.`,
        });
      }
  
      // 2. Fetch associated user
      const user = await User.findById(serviceProvider.user_id).select("-password");
  
      // 3. Product pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const totalProducts = await Product.countDocuments({ seller_id: serviceProvider._id });
  
      // 4. Fetch paginated products with category relations
      const products = await Product.find({ seller_id: serviceProvider._id })
        .populate("category_id sub_category_id super_sub_category_id deep_sub_category_id")
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });
  
      // 5. Map attributes to each product
      const productsWithAttributes = await Promise.all(
        products.map(async (product) => {
          const attributes = await ProductAttribute.find({ product_id: product._id });
      
          return {
            ...product.toObject(),
            attributes: attributes.map((attr) => ({
              attribute_key: attr.attribute_key,
              attribute_value: attr.attribute_value,
            })),
            category_name: product.category_id?.name || null,
            sub_category_name: product.sub_category_id?.name || null,
            super_sub_category_name: product.super_sub_category_id?.name || null,
            deep_sub_category_name: product.deep_sub_category_id?.name || null,
          };
        })
      );
      
      // 6. Respond
      return res.status(200).json({
        success: true,
        serviceProvider,
        user,
        products: productsWithAttributes,
        pagination: {
          totalProducts,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalProducts / limit),
          pageSize: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Error fetching service provider or products:", error);
      return res.status(500).json({
        success: false,
        error: "An unexpected error occurred. Please try again later.",
      });
    }
  };
  
exports.getServiceProviderById = async (req, res) => {
    try {
        const serviceProvider = await ServiceProvider.findById(req.params.id).populate('user_id').populate('address_id');
        if (!serviceProvider) return res.status(404).json({
            statusCode: 404,
            success: false,
            message: 'Service Provider not found',
            data: null
        });
        res.json({
            statusCode: 200,
            success: true,
            message: 'Service Provider fetched successfully',
            data: serviceProvider
        });
    } catch (error) {
        res.status(500).json({
            statusCode: 500,
            success: false,
            message: error.message,
            data: null
        });
    }
};

exports.updateServiceProvider = async (req, res) => {
    try {
        const serviceProvider = await ServiceProvider.findById(req.params.id);
        if (!serviceProvider) {
            return res.status(404).json({
                statusCode: 404,
                success: false,
                message: 'Service Provider not found',
            });
        }

        Object.assign(serviceProvider, req.body);

        // Cross-model verification sync on update
        const verificationFlags = await getSyncVerificationFlags(serviceProvider.user_id, serviceProvider.company_email, serviceProvider.company_phone_number);
        serviceProvider.email_verified = verificationFlags.email_verified;
        serviceProvider.number_verified = verificationFlags.number_verified;

        await serviceProvider.save();

        res.json({
            statusCode: 200,
            success: true,
            message: 'Service Provider updated successfully',
            data: serviceProvider
        });
    } catch (error) {
        res.status(400).json({
            statusCode: 400,
            success: false,
            message: error.message,
        });
    }
};

exports.deleteServiceProvider = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find ServiceProvider
    const serviceProvider = await ServiceProvider.findById(id);
    if (!serviceProvider) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: 'Service Provider not found',
      });
    }

    // 2. Get USER role
    const userRole = await Role.findOne({ role: "USER" });
    if (!userRole) {
      return res.status(500).json({
        statusCode: 500,
        success: false,
        message: 'Default USER role not found in database',
      });
    }

    // 3. Revert user role to USER
    const updatedUser = await User.findByIdAndUpdate(
      serviceProvider.user_id,
      { role: userRole._id, updated_at: new Date() },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(500).json({
        statusCode: 500,
        success: false,
        message: 'Failed to update user role',
      });
    }

    // 4. Delete ServiceProvider → CASCADE HOOK DELETES ALL PRODUCTS
    await ServiceProvider.deleteOne({ _id: id });

    // 5. Success
    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'Service Provider and all associated products deleted successfully. User role reverted to USER.',
      data: {
        deletedServiceProviderId: id,
        user: {
          user_id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: "USER",
        },
      },
    });

  } catch (error) {
    console.error("Error deleting service provider:", error);

    return res.status(500).json({
      statusCode: 500,
      success: false,
      message: 'Failed to delete service provider',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
// exports.createMinimalServiceProvider = async (req, res) => {
//   try {
//     const { company_email, company_phone_number, travels_name, user_id } = req.body;

//     // Basic validation
//     if (!company_email || !company_phone_number || !travels_name || !user_id) {
//       return res.status(400).json({ message: 'Missing required fields' });
//     }

//     // Check if service provider already exists
//     const existingProvider = await ServiceProvider.findOne({ user_id });
//     if (existingProvider) {
//       return res.status(400).json({ message: 'Service provider profile already exists for this user' });
//     }

//     // Validate email
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(company_email)) {
//       return res.status(400).json({ message: 'Invalid email format' });
//     }

//     // Find SERVICE_PROVIDER role
//     const serviceProviderRole = await Role.findOne({ role: 'SERVICE_PROVIDER' });
//     if (!serviceProviderRole) {
//       return res.status(500).json({ message: "SERVICE_PROVIDER role not found" });
//     }

//     // Update user's role
//     const user = await User.findByIdAndUpdate(
//       user_id,
//       { role: serviceProviderRole._id, updated_at: new Date() },
//       { new: true }
//     );

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Create new service provider
//     const newProvider = new ServiceProvider({
//       user_id,
//       company_email,
//       company_phone_number,
//       travels_name,
//       verified_status: false,
//       trust_shield: false,
//     });
//     await newProvider.save();

//     return res.status(201).json({
//       message: 'Minimal service provider profile created successfully and user role updated to SERVICE_PROVIDER',
//       provider: newProvider,
//       user: {
//         user_id: user._id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         role: serviceProviderRole.role
//       },
//       forceLogout: true
//     });

//   } catch (error) {
//     console.error('Error creating minimal service provider:', error);
//     return res.status(500).json({
//       message: 'Server error while creating service provider profile',
//       error: error.message
//     });
//   }
// };

exports.createMinimalServiceProvider = async (req, res) => {
  try {
    const { company_email, company_phone_number, travels_name, user_id } = req.body;

    if (!company_email || !company_phone_number || !travels_name || !user_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingProvider = await ServiceProvider.findOne({ user_id });
    if (existingProvider) {
      return res.status(400).json({ message: 'Service provider profile already exists for this user' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(company_email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const serviceProviderRole = await Role.findOne({ role: 'SERVICE_PROVIDER' });
    if (!serviceProviderRole) {
      return res.status(500).json({ message: "SERVICE_PROVIDER role not found" });
    }

    // === UPDATE USER ROLE ===
    const user = await User.findByIdAndUpdate(
      user_id,
      { role: serviceProviderRole._id, updated_at: new Date() },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    // === CREATE SERVICE PROVIDER ===
    const newProvider = new ServiceProvider({
      user_id,
      company_email,
      company_phone_number,
      travels_name,
      verified_status: false,
      trust_shield: false,
    });

    // Cross-model verification sync (minimal)
    const verificationFlags = await getSyncVerificationFlags(user_id, company_email, company_phone_number);
    newProvider.email_verified = verificationFlags.email_verified;
    newProvider.number_verified = verificationFlags.number_verified;

    await newProvider.save();

    // === ASSIGN FREE PLAN ===
    const planResult = await assignFreePlan(user_id, true);
    if (!planResult.success) {
      console.warn("Failed to assign free plan:", planResult.message);
    }

    return res.status(201).json({
      message: `Service provider created. Free plan assigned (expires: ${planResult.endDate || 'N/A'})`,
      provider: newProvider,
      user: {
        user_id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: serviceProviderRole.role
      },
      subscription: planResult.success ? { expires_on: planResult.endDate } : null,
      forceLogout: true
    });

  } catch (error) {
    console.error('Error creating minimal service provider:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getServiceProviderByUserId = async (req, res) => {
  try {
    const serviceProvider = await ServiceProvider.findOne({ user_id: req.params.userId })
      .populate('user_id', 'name email') // Optional: populate user details if needed
      .populate('address_id'); // Optional: populate address details if needed

    if (!serviceProvider) {
      return res.status(404).json({
        success: false,
        message: 'Service provider not found',
      });
    }

    res.status(200).json({
      success: true,
      data: serviceProvider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

exports.createServiceProviderByUserId = async (req, res) => {
  try {
    const { user_id, travels_name, company_email, company_phone_number } = req.body;

    if (!user_id || !travels_name || !company_email || !company_phone_number) {
      return res.status(400).json({ success: false, error: true, message: "Missing required fields: user_id, travels_name, company_email, company_phone_number" });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ success: false, error: true, message: "User not found" });
    }

    const userRole = await Role.findOne({ role: "USER" });
    if (!userRole || user.role.toString() !== userRole._id.toString()) {
      return res.status(400).json({ success: false, error: true, message: "User must have USER role" });
    }

    const existingProvider = await ServiceProvider.findOne({ user_id });
    if (existingProvider) {
      return res.status(400).json({ success: false, error: true, message: "Service provider already exists for this user" });
    }

    const existingEmail = await ServiceProvider.findOne({ company_email });
    if (existingEmail) {
      return res.status(400).json({ success: false, error: true, message: "Company email already in use" });
    }

    const newServiceProvider = new ServiceProvider({
      user_id,
      travels_name,
      company_email,
      company_phone_number,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Cross-model verification sync
    const verificationFlags = await getSyncVerificationFlags(user_id, company_email, company_phone_number);
    newServiceProvider.email_verified = verificationFlags.email_verified;
    newServiceProvider.number_verified = verificationFlags.number_verified;

    await newServiceProvider.save();

    const serviceProviderRole = await Role.findOne({ role: "SERVICE_PROVIDER" });
    if (serviceProviderRole) {
      user.role = serviceProviderRole._id;
      await user.save();
    } else {
      console.warn("SERVICE_PROVIDER role not found; user role not updated");
    }

    return res.status(201).json({
      success: true,
      error: false,
      message: "Service provider created successfully",
      data: newServiceProvider,
    });
  } catch (error) {
    console.error("Create service provider error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: "Error creating service provider",
      details: error.message,
    });
  }
};