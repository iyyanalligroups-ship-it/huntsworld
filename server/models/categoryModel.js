// models/Category.js
const mongoose = require("mongoose");
const SubCategory = require('../models/subCategoryModel');
const SuperSubCategory = require('../models/superSubCategoryModel');
const DeepSubCategory = require('../models/deepSubCategoryModel');

const CategorySchema = new mongoose.Schema(
  {
    category_name: { type: String, required: true, unique: true, trim: true },
    category_image: { type: String },
  },
  { timestamps: true }
);

// ────── HOOK 1: deleteOne (when using deleteOne()) ──────
CategorySchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    const subCount = await SubCategory.countDocuments({ category_id: this._id });
    const superCount = await SuperSubCategory.countDocuments({ category_id: this._id });
    const deepCount = await DeepSubCategory.countDocuments({ category_id: this._id });

    if (subCount + superCount + deepCount > 0) {
      const error = new Error(
        `Cannot delete category. It has ${subCount} sub-categories, ${superCount} super sub-categories, and ${deepCount} deep sub-categories. Delete them first.`
      );
      error.name = 'DeletionRestrictedError';
      return next(error);
    }
    next();
  } catch (err) {
    next(err);
  }
});

// ────── HOOK 2: findOneAndDelete (for findByIdAndDelete) ──────
CategorySchema.pre('findOneAndDelete', async function (next) {
  try {
    const doc = await this.model.findOne(this.getQuery());
    if (!doc) return next();

    const subCount = await SubCategory.countDocuments({ category_id: doc._id });
    const superCount = await SuperSubCategory.countDocuments({ category_id: doc._id });
    const deepCount = await DeepSubCategory.countDocuments({ category_id: doc._id });

    if (subCount + superCount + deepCount > 0) {
      const error = new Error(
        `Cannot delete category. It has ${subCount} sub-categories, ${superCount} super sub-categories, and ${deepCount} deep sub-categories. Delete them first.`
      );
      error.name = 'DeletionRestrictedError';
      return next(error);
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Category", CategorySchema);