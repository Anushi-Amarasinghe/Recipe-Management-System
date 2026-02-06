const mongoose = require("mongoose");

const mealSlotSchema = new mongoose.Schema({
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Recipe",
    required: true
  }
}, { _id: false });

const daySchema = new mongoose.Schema({
  breakfast: mealSlotSchema,
  lunch: mealSlotSchema,
  dinner: mealSlotSchema
}, { _id: false });

const mealPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
    required: true
  },
  week: {
    monday: daySchema,
    tuesday: daySchema,
    wednesday: daySchema,
    thursday: daySchema,
    friday: daySchema,
    saturday: daySchema,
    sunday: daySchema
  }
}, { timestamps: true });

module.exports = mongoose.model("MealPlan", mealPlanSchema);
