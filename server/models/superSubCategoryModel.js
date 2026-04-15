// models/SuperSubCategory.js
const mongoose = require("mongoose");
const DeepSubCategory = require("../models/deepSubCategoryModel");

const SuperSubCategorySchema = new mongoose.Schema(
  {
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    sub_category_id: { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory", required: true },
    super_sub_category_name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

/* ---- deleteOne (document mode) ---- */
SuperSubCategorySchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  try {
    const deep = await DeepSubCategory.countDocuments({ super_sub_category_id: this._id });
    if (deep > 0) {
      const err = new Error(
        `Cannot delete super sub-category. It has ${deep} deep sub-categories. Delete them first.`
      );
      err.name = "DeletionRestrictedError";
      return next(err);
    }
    next();
  } catch (e) { next(e); }
});

/* ---- findOneAndDelete (used by findByIdAndDelete) ---- */
SuperSubCategorySchema.pre("findOneAndDelete", async function (next) {
  try {
    const doc = await this.model.findOne(this.getQuery());
    if (!doc) return next();

    const deep = await DeepSubCategory.countDocuments({ super_sub_category_id: doc._id });
    if (deep > 0) {
      const err = new Error(
        `Cannot delete super sub-category. It has ${deep} deep sub-categories. Delete them first.`
      );
      err.name = "DeletionRestrictedError";
      return next(err);
    }
    next();
  } catch (e) { next(e); }
});

module.exports = mongoose.model("SuperSubCategory", SuperSubCategorySchema);