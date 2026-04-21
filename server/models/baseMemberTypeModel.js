const mongoose = require("mongoose");

const BaseMemberTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    has_full_access: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Pre-save middleware to normalize the name
BaseMemberTypeSchema.pre("save", function (next) {
  if (this.isModified("name") || this.isNew) {
    if (this.name) {
      // Normalize: Title Case + replace spaces with underscores
      const normalized = this.name
        .trim()
        .split(/\s+/) // split on any whitespace
        .map((word) => {
          if (word.length === 0) return "";
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .filter(Boolean) // remove empty parts
        .join("_");

      this.name = normalized;
    }
  }
  next();
});

// Also useful: normalize on findOneAndUpdate (for update operations)
BaseMemberTypeSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  if (update && update.name) {
    const normalized = update.name
      .trim()
      .split(/\s+/)
      .map((word) => {
        if (word.length === 0) return "";
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .filter(Boolean)
      .join("_");

    this.setUpdate({ ...update, name: normalized });
  }

  next();
});

// Optional: Add a virtual or method to display nicely if needed later
BaseMemberTypeSchema.virtual("displayName").get(function () {
  return this.name.replace(/_/g, " ");
});

module.exports = mongoose.models.BaseMemberType || mongoose.model("BaseMemberType", BaseMemberTypeSchema);
