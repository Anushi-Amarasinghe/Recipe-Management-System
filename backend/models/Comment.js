const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  comment: { type: String, required: true },
  recipe_id: { type: String, required: true },
  user_id: { type: String, required: true },
  created_date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Comment", commentSchema);
