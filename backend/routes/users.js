const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET public user details by ID (no auth required)
router.get("/public/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // console.log("🔥 user route LOADED");
    // Only select safe public fields
    const user = await User.findById(userId).select("f_name l_name role");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Combine first + last name
    const author_name = `${user.f_name} ${user.l_name}`;

    res.json({
      user: {
        id: user._id,
        name: author_name,
        role: user.role,
        avatarUrl: "images/chef.png" // default avatar
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
