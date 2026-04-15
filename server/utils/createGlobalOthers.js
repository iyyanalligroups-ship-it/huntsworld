// utils/createGlobalOthers.js  ← REPLACE ENTIRE FILE WITH THIS

const SubCategory = require("../models/subCategoryModel");
const SuperSubCategory = require("../models/superSubCategoryModel");
const DeepSubCategory = require("../models/deepSubCategoryModel");

const GLOBAL_OTHERS_NAME = "others";
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/150/cccccc/666666?text=Others";

let cachedOthers = null;

// This runs ONCE at server start and guarantees the records exist
const ensureGlobalOthers = async () => {
  if (cachedOthers) return cachedOthers;

  try {
    // 1. SubCategory "others"
    let sub = await SubCategory.findOneAndUpdate(
      { sub_category_name: GLOBAL_OTHERS_NAME },
      {
        sub_category_name: GLOBAL_OTHERS_NAME,
        sub_category_image: PLACEHOLDER_IMAGE,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 2. SuperSubCategory "others"
    let superSub = await SuperSubCategory.findOneAndUpdate(
      {
        super_sub_category_name: GLOBAL_OTHERS_NAME,
        sub_category_id: sub._id,
      },
      {
        super_sub_category_name: GLOBAL_OTHERS_NAME,
        super_sub_category_image: PLACEHOLDER_IMAGE,
        sub_category_id: sub._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 3. DeepSubCategory "others"
    let deep = await DeepSubCategory.findOneAndUpdate(
      {
        deep_sub_category_name: GLOBAL_OTHERS_NAME,
        super_sub_category_id: superSub._id,
      },
      {
        deep_sub_category_name: GLOBAL_OTHERS_NAME,
        deep_sub_category_image: PLACEHOLDER_IMAGE,
        sub_category_id: sub._id,
        super_sub_category_id: superSub._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    cachedOthers = {
      subCategoryId: sub._id.toString(),
      superSubCategoryId: superSub._id.toString(),
      deepSubCategoryId: deep._id.toString(),
    };

    return cachedOthers;
  } catch (error) {
    console.error("Failed to ensure global others:", error);
    throw error;
  }
};

// Public function used by route
const getGlobalOthersIds = async () => {
  if (cachedOthers) return cachedOthers;
  return await ensureGlobalOthers();
};

module.exports = { ensureGlobalOthers, getGlobalOthersIds };
