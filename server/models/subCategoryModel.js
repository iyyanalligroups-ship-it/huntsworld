// models/SubCategory.js   (unchanged – keep both hooks)
const mongoose = require("mongoose");
const SuperSubCategory = require("../models/superSubCategoryModel");
const DeepSubCategory   = require("../models/deepSubCategoryModel");

const SubCategorySchema = new mongoose.Schema(
  {
    category_id:        { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    sub_category_name:  { type: String, required: true, trim: true },
    sub_category_image: { type: String },
  },
  { timestamps: true }
);

/* ---- deleteOne (document mode) ---- */
SubCategorySchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  try {
    const sup  = await SuperSubCategory.countDocuments({ sub_category_id: this._id });
    const deep = await DeepSubCategory.countDocuments({ sub_category_id: this._id });
    if (sup + deep > 0) {
      const err = new Error(
        `Cannot delete sub‑category. It has ${sup} super sub‑categories and ${deep} deep sub‑categories. Delete them first.`
      );
      err.name = "DeletionRestrictedError";
      return next(err);
    }
    next();
  } catch (e) { next(e); }
});

/* ---- findOneAndDelete (used by findByIdAndDelete) ---- */
SubCategorySchema.pre("findOneAndDelete", async function (next) {
  try {
    const doc = await this.model.findOne(this.getQuery());
    if (!doc) return next();

    const sup  = await SuperSubCategory.countDocuments({ sub_category_id: doc._id });
    const deep = await DeepSubCategory.countDocuments({ sub_category_id: doc._id });
    if (sup + deep > 0) {
      const err = new Error(
        `Cannot delete sub‑category. It has ${sup} super sub‑categories and ${deep} deep sub‑categories. Delete them first.`
      );
      err.name = "DeletionRestrictedError";
      return next(err);
    }
    next();
  } catch (e) { next(e); }
});

module.exports = mongoose.model("SubCategory", SubCategorySchema);