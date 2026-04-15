const Merchant = require("../models/MerchantModel");
const ServiceProvider = require("../models/serviceProviderModel");
const User = require("../models/userModel");
const Address = require("../models/addressModel");
const Product = require("../models/productModel");
const ProductAttribute = require("../models/productAttributeModel");

exports.getSellerBySlug = async (req, res) => {
  try {
    let { slug } = req.params;

    if (!slug || !slug.trim()) {
      return res.status(400).json({
        success: false,
        message: "Slug is required",
      });
    }

    // 🔥 Normalize helper (JS side)
    const normalize = (str = "") =>
      str
        .toLowerCase()
        .replace(/[-_]+/g, " ") // handles - and _
        .replace(/\s+/g, " ")
        .trim();

    const normalizedSlug = normalize(slug);

    // 🔥 Helper: Mongo-safe normalized search
    const findSeller = async (Model, field) => {
      return await Model.findOne({
        $expr: {
          $eq: [
            {
              $trim: {
                input: {
                  $replaceAll: {
                    input: {
                      $replaceAll: {
                        input: { $toLower: `$${field}` },
                        find: "_",
                        replacement: " ",
                      },
                    },
                    find: "-",
                    replacement: " ",
                  },
                },
              },
            },
            normalizedSlug,
          ],
        },
      })
        .populate({ path: "user_id", select: "name email phone_number" })
        .populate({
          path: "address_id",
          select: "street city state country postal_code",
        });
    };

    /* ===================== MERCHANT ===================== */

    let merchant = await findSeller(Merchant, "company_name");

    if (merchant) {
      const products = await Product.find({
        seller_id: merchant._id,
        product_verified_by_admin: true,
      })
        .populate(
          "category_id sub_category_id super_sub_category_id deep_sub_category_id"
        )
        .sort({ createdAt: -1 });

      const productsWithAttributes = await Promise.all(
        products.map(async (product) => {
          const attributes = await ProductAttribute.find({
            product_id: product._id,
          });

          return {
            ...product.toObject(),
            attributes: attributes.map((attr) => ({
              attribute_key: attr.attribute_key,
              attribute_value: attr.attribute_value,
            })),
            category_name: product.category_id?.name || null,
            sub_category_name: product.sub_category_id?.name || null,
            super_sub_category_name:
              product.super_sub_category_id?.name || null,
            deep_sub_category_name:
              product.deep_sub_category_id?.name || null,
          };
        })
      );

      return res.status(200).json({
        success: true,
        merchant: {
          ...merchant.toObject(),
          company_images: merchant.company_images || [],
        },
        user: merchant.user_id,
        address: merchant.address_id,
        products: productsWithAttributes,
        entityType: "Merchant",
      });
    }

    /* ===================== SERVICE PROVIDER ===================== */

    let serviceProvider = await findSeller(
      ServiceProvider,
      "travels_name"
    );

    if (serviceProvider) {
      const products = await Product.find({
        seller_id: serviceProvider._id,
        product_verified_by_admin: true,
      })
        .populate(
          "category_id sub_category_id super_sub_category_id deep_sub_category_id"
        )
        .sort({ createdAt: -1 });

      const productsWithAttributes = await Promise.all(
        products.map(async (product) => {
          const attributes = await ProductAttribute.find({
            product_id: product._id,
          });

          return {
            ...product.toObject(),
            attributes: attributes.map((attr) => ({
              attribute_key: attr.attribute_key,
              attribute_value: attr.attribute_value,
            })),
            category_name: product.category_id?.name || null,
            sub_category_name: product.sub_category_id?.name || null,
            super_sub_category_name:
              product.super_sub_category_id?.name || null,
            deep_sub_category_name:
              product.deep_sub_category_id?.name || null,
          };
        })
      );

      return res.status(200).json({
        success: true,
        serviceProvider: {
          ...serviceProvider.toObject(),
          company_images: serviceProvider.company_images || [],
        },
        user: serviceProvider.user_id,
        address: serviceProvider.address_id,
        products: productsWithAttributes,
        entityType: "ServiceProvider",
      });
    }

    /* ===================== NOT FOUND ===================== */

    return res.status(404).json({
      success: false,
      message: `No seller found with the slug: ${slug}`,
    });
  } catch (error) {
    console.error("Error fetching seller by slug:", error);
    return res.status(500).json({
      success: false,
      error: "An unexpected error occurred. Please try again later.",
    });
  }
};

