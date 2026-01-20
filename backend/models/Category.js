const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Category name is required"],
    trim: true,
    unique: true,
    minlength: [2, "Category name must be at least 2 characters"],
    maxlength: [50, "Category name cannot exceed 50 characters"]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, "Description cannot exceed 200 characters"],
    default: ""
  },
  icon: {
    type: String,
    trim: true,
    default: "fa-utensils"
  },
  color: {
    type: String,
    trim: true,
    default: "#4CAF50"
  },
  isActive: {
    type: Boolean,
    default: true
  },
  recipeCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { 
  timestamps: true 
});

// Indexes
categorySchema.index({ name: 1 });
categorySchema.index({ isActive: 1 });

module.exports = mongoose.model("Category", categorySchema);
