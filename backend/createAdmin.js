const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User"); // adjust path if needed

const MONGO_URI = "mongodb://localhost:27017/recipes_db";

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    const email = "admin@gmail.com";

    // Check if admin already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(" Admin user already exists");
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    // Create admin user
    await User.create({
      f_name: "System",
      l_name: "Admin",
      email: email,
      password: hashedPassword,
      role: "admin",      
      status: "active",
      active: 1,
      isDeleted: false
    });

    console.log(" Admin user created successfully");
    process.exit(0);

  } catch (error) {
    console.error(" Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
