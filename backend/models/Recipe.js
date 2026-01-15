const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true, trim: true },
    desc: { type: String, required: true, trim: true },
    category: { type: String, default: "Dinner" },
    rating: { type: Number, default: 0 },
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recipe", recipeSchema);
