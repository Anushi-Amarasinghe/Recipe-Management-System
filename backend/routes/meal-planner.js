const express = require("express");
const router = express.Router();
const MealPlan = require("../models/MealPlan");
const auth = require("../middleware/authMiddleware");

// Get current user's meal plan
router.get("/", auth, async (req, res) => {
  try {
    const plan = await MealPlan.findOne({ user: req.user.id })
      .populate("week.monday.breakfast.recipe")
      .populate("week.monday.lunch.recipe")
      .populate("week.monday.dinner.recipe")
      .populate("week.tuesday.breakfast.recipe")
      .populate("week.tuesday.lunch.recipe")
      .populate("week.tuesday.dinner.recipe")
      .populate("week.wednesday.breakfast.recipe")
      .populate("week.wednesday.lunch.recipe")
      .populate("week.wednesday.dinner.recipe")
      .populate("week.thursday.breakfast.recipe")
      .populate("week.thursday.lunch.recipe")
      .populate("week.thursday.dinner.recipe")
      .populate("week.friday.breakfast.recipe")
      .populate("week.friday.lunch.recipe")
      .populate("week.friday.dinner.recipe")
      .populate("week.saturday.breakfast.recipe")
      .populate("week.saturday.lunch.recipe")
      .populate("week.saturday.dinner.recipe")
      .populate("week.sunday.breakfast.recipe")
      .populate("week.sunday.lunch.recipe")
      .populate("week.sunday.dinner.recipe");

    res.json({ plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load meal plan" });
  }
});

// Save/update a meal slot
router.post("/", auth, async (req, res) => {
  const { day, meal, recipeId } = req.body;

  if (!day || !meal || !recipeId) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const updatePath = `week.${day}.${meal}`;

    const plan = await MealPlan.findOneAndUpdate(
      { user: req.user.id },
      { $set: { [updatePath]: { recipe: recipeId } } },
      { new: true, upsert: true }
    );

    res.json({ success: true, plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save meal" });
  }
});

// Remove meal slot
router.delete("/", auth, async (req, res) => {
  const { day, meal } = req.body;

  try {
    const updatePath = `week.${day}.${meal}`;

    await MealPlan.findOneAndUpdate(
      { user: req.user.id },
      { $unset: { [updatePath]: "" } }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove meal" });
  }
});

module.exports = router;
