const mongoose = require("mongoose");

const HelpRequestSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    enum: ["pending", "picked", "closed"],
    default: "pending",
  },

  picked_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    default: null,
  },

}, { timestamps: true });

module.exports = mongoose.model("HelpRequest", HelpRequestSchema);
