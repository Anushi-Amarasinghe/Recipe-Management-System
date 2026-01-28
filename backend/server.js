<<<<<<< HEAD
require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}...`)
);
=======
// backend/server.js
require("dotenv").config();
const app = require("./app");
const connectDB = require("./src/db");

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    console.log("✅ Database connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error("❌ Server failed to start:", e);
    process.exit(1);
  }
})();
>>>>>>> main
