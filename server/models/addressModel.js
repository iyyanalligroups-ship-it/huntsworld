const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    entity_type: {
      type: String,
      enum: [
        "user",
        "merchant",
        "grocery_seller",
        "sub-dealer",
        "service_provider",
        "student",
        "admin",
        "sub_admin",
      ],
      required: true,
      index: true,
    },

    address_type: {
      type: String,
      enum: ["personal", "company"],
      required: true,
      index: true,
    },

    address_line_1: { type: String, required: true, trim: true },
    address_line_2: { type: String, trim: true },

    city: {
      type: String,
      required: true,
      set: (v) => v.trim().toLowerCase(),
    },

    state: {
      type: String,
      required: true,
      set: (v) => v.trim().toLowerCase(),
    },

    country: {
      type: String,
      required: true,
      set: (v) => v.trim().toLowerCase(),
    },

    pincode: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// ----------------------------------------------------
// FAST & SAFE HARD DELETE INDEX
// ----------------------------------------------------
AddressSchema.index(
  { user_id: 1, entity_type: 1, address_type: 1 },
  { name: "user_entity_address_type_idx" }
);

module.exports = mongoose.model("Address", AddressSchema);
