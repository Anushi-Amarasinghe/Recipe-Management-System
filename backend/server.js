require("dotenv").config();
const app = require("./app");
const connectDB = require("./src/db");

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
