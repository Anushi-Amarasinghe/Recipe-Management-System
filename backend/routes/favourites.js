const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");

router.post("/:recipeId", auth, async (req, res) => {
    console.log(req)
  try {
    const user = await User.findById(req.user.id);
    console.log(user)
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    
    if (!Array.isArray(user.favourites)) {
      user.favourites = [];
    }

    const recipeId = req.params.recipeId;
    const index = user.favourites.findIndex(
      id => id.toString() === recipeId
    );

    if (index === -1) {
      user.favourites.push(recipeId);
    } else {
      user.favourites.splice(index, 1);
    }

    await user.save();

    res.json({ success: true, favourites: user.favourites });

  } catch (err) {
    console.error("FAVOURITES ERROR:", err);
    res.status(500).json({ message: "Failed to update favourites" });
  }
});


module.exports = router;
