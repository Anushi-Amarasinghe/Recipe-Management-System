const mongoose = require("mongoose");

const instructionSchema = new mongoose.Schema(
  {
    stepNumber: {
      type: Number,
      required: true
    },
    text: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    ingredients: {
      type: [String],
      required: true,
      validate: v => v.length > 0
    },
    instructions: {
      type: [instructionSchema],
      required: true,
      validate: v => v.length > 0
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recipe", recipeSchema);
