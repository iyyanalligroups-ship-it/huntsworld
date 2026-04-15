const mongoose = require("mongoose");

const DeepSubCategorySchema = new mongoose.Schema(
  {

    category_id:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    sub_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: true,
    },
    super_sub_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperSubCategory",
      required: true,
    },
    deep_sub_category_name: {
      type: String,
      required: true,
      trim: true,
    },
    deep_sub_category_image: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeepSubCategory", DeepSubCategorySchema);
