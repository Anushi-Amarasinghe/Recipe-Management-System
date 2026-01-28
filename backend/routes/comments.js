// routes/comments.js
const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");
const auth = require("../middleware/authMiddleware");

// POST a comment
router.post("/", auth, async (req, res) => {
  try {
    const { recipe_id, comment } = req.body;

    if (!recipe_id || !comment) {
      return res.status(400).json({ message: "Recipe ID and comment are required" });
    }

    const newComment = new Comment({
      comment,
      recipe_id,
      user_id: req.userId,
      created_date: new Date(),
    });

    await newComment.save();
    res.status(201).json({ message: "Comment added", comment: newComment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET comments for a recipe
router.get("/:recipeId", async (req, res) => {
  try {
    const { recipeId } = req.params;
    const comments = await Comment.find({ recipe_id: recipeId })
      .sort({ created_date: -1 }); // latest first
    res.json({ comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
