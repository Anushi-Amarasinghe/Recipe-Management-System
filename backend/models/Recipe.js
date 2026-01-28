const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    desc: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      default: "Dinner"
    },

    rating: {
      type: Number,
      default: 0
    },

    imageUrl: {
      type: String,
      default: ""
    },

    ingredients: {
      type: [String],
      default: []
    },

    instructions: {
      type: [String],
      default: []
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium"
    },

    dietary: {
      type: [String],
      default: []
    },

    tags: {
      type: [String],
      default: []
    },

    notes: {
      type: String,
      trim: true,
      default: ""
    },

    cookingTime: {
      type: Number,
      default: 0
    },

    prepTime: {
      type: Number,
      default: 0
    },

    servings: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Pre-save hook for cleanup
recipeSchema.pre("save", function () {
  if (Array.isArray(this.ingredients)) {
    this.ingredients = this.ingredients
      .map(i => String(i).trim())
      .filter(Boolean);
  }

  if (Array.isArray(this.instructions)) {
    this.instructions = this.instructions
      .map(i => String(i).trim())
      .filter(Boolean);
  }

  if (Array.isArray(this.dietary)) {
    this.dietary = this.dietary
      .map(d => String(d).trim())
      .filter(Boolean);
  }

  if (Array.isArray(this.tags)) {
    this.tags = this.tags
      .map(t => String(t).trim().toLowerCase())
      .filter(Boolean);
  }
});

module.exports = mongoose.model("Recipe", recipeSchema);
