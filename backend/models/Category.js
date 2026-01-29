const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  // Category name - required and unique
  name: {
    type: String,
    required: [true, "Category name is required"],  // Custom error message
    trim: true,                                      // Remove whitespace
    unique: true,                                    // No duplicates
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [50, "Name cannot exceed 50 characters"]
  },
  
  // Optional description
  description: {
    type: String,
    trim: true,
    maxlength: [200, "Description cannot exceed 200 characters"],
    default: ""
  },
  
  // FontAwesome icon class for UI
  icon: {
    type: String,
    trim: true,
    default: "fa-utensils"
  },
  
  // Hex color for UI display
  color: {
    type: String,
    trim: true,
    default: "#4CAF50"
  },
  
  // Soft delete / deactivation support
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Track number of recipes in this category
  recipeCount: {
    type: Number,
    default: 0
  },
  
  // Who created this category (reference to User)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  // Who last updated this category
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { 
  timestamps: true  // Adds createdAt and updatedAt automatically
});

// Indexes for faster queries
categorySchema.index({ name: 1 });
categorySchema.index({ isActive: 1 });

module.exports = mongoose.model("Category", categorySchema);