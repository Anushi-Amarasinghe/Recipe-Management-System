const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  f_name: {
    type: String,
    required: true
  },
  l_name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  // NEW: Status field for account management (US3)
  status: {
    type: String,
    enum: ["active", "inactive", "suspended", "deleted"],
    default: "active"
  },
  active: {
    type: Number,
    default: 1
  },
  // NEW: Deactivation tracking (US3-T.2)
  deactivatedAt: {
    type: Date,
    default: null
  },
  deactivatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  deactivationReason: {
    type: String,
    default: null
  },
  // NEW: Soft delete support (US3-T.3)
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  created_date: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to ensure email is always lowercase and trimmed
userSchema.pre("save", async function () {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
});

// Indexes for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ isDeleted: 1 });

// Virtual for full name
userSchema.virtual("fullName").get(function() {
  return `${this.f_name} ${this.l_name}`;
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("User", userSchema);
