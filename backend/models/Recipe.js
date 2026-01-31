const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema(
  {
    // Owner
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Core fields
    title: {
      type: String,
      required: true,
      trim: true,
    },

    desc: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      default: "Dinner",
      trim: true,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
    },

    imageUrl: {
      type: String,
      default: "",
    },

    // Arrays
    ingredients: {
      type: [String],
      default: [],
    },

    instructions: {
      type: [String],
      default: [],
    },

    dietary: {
      type: [String],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
    },

    // Meta
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },

    cookingTime: {
      type: Number,
      default: 0,
    },

    prepTime: {
      type: Number,
      default: 0,
    },

    servings: {
      type: Number,
      default: 0,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    // Soft delete
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/* =================================================
   🔍 SEARCH INDEX (US4 – Performance)
================================================= */
recipeSchema.index({
  title: "text",
  ingredients: "text",
  tags: "text",
});

/* =================================================
   🧹 Data cleanup before save
================================================= */
recipeSchema.pre("save", function (next) {
  if (Array.isArray(this.ingredients)) {
    this.ingredients = this.ingredients
      .map(i => String(i).trim())
      .filter(i => i.length > 0);
  }

  if (Array.isArray(this.instructions)) {
    this.instructions = this.instructions
      .map(i => String(i).trim())
      .filter(i => i.length > 0);
  }

  if (Array.isArray(this.dietary)) {
    this.dietary = this.dietary
      .map(d => String(d).trim())
      .filter(d => d.length > 0);
  }

  if (Array.isArray(this.tags)) {
    this.tags = this.tags
      .map(t => String(t).trim().toLowerCase())
      .filter(t => t.length > 0);
  }

  next();
});

module.exports = mongoose.model("Recipe", recipeSchema);
