const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  f_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  l_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true // Index for faster email lookups
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
    index: true // Index for role-based queries
  },
  active: {
    type: Number,
    default: 1,
    enum: [0, 1] // Only allow 0 or 1
  },
  created_date: {
    type: Date,
    default: Date.now,
    immutable: true // Cannot be changed after creation
  },
  updated_date: {
    type: Date,
    default: Date.now
  }
}, {
  // Schema options
  timestamps: false, // We're using custom timestamp fields (created_date, updated_date)
  collection: "users" // Explicit collection name
});

// Pre-save hook to ensure email is always lowercase and trimmed
userSchema.pre("save", function(next) {
  // Normalize email
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  
  // Update updated_date on every save (except for new documents)
  if (!this.isNew) {
    this.updated_date = new Date();
  }
  
  next();
});

// Index for common queries
userSchema.index({ email: 1 }); // Already indexed via unique, but explicit for clarity
userSchema.index({ role: 1, active: 1 }); // Compound index for admin queries
userSchema.index({ created_date: -1 }); // Index for sorting by creation date

// Virtual for full name
userSchema.virtual("fullName").get(function() {
  return `${this.f_name} ${this.l_name}`;
});

// Ensure virtuals are included in JSON output
userSchema.set("toJSON", {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password; // Never return password in JSON
    delete ret.__v; // Remove version key
    return ret;
  }
});

module.exports = mongoose.model("User", userSchema);
