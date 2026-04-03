const mongoose = require("mongoose");

const TYPES = ["income", "expense"];
const CATEGORIES = [
  "salary",
  "freelance",
  "investment",
  "sales",
  "rent",
  "utilities",
  "food",
  "transport",
  "healthcare",
  "education",
  "entertainment",
  "other",
];

const recordSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    type: {
      type: String,
      required: [true, "Type is required"],
      enum: { values: TYPES, message: "Type must be income or expense" },
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: { values: CATEGORIES, message: `Category must be one of: ${CATEGORIES.join(", ")}` },
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries on common filter fields
recordSchema.index({ type: 1, category: 1, date: -1 });
recordSchema.index({ createdBy: 1 });

// Soft-delete filter by default (Mongoose 9: query hooks omit next)
recordSchema.pre(/^find/, function () {
  this.where({ isDeleted: false });
});

module.exports = mongoose.model("Record", recordSchema);
module.exports.TYPES = TYPES;
module.exports.CATEGORIES = CATEGORIES;
