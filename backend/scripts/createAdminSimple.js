/**
 * Simple script to create an admin user (no interactive prompts)
 * 
 * Usage:
 *   node scripts/createAdminSimple.js
 * 
 * Or with environment variables:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=Admin123! npm run create-admin
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Configuration - EDIT THESE VALUES
const ADMIN_CONFIG = {
  email: process.env.ADMIN_EMAIL || "admin@example.com",
  password: process.env.ADMIN_PASSWORD || "Admin123!",
  f_name: process.env.ADMIN_FNAME || "Admin",
  l_name: process.env.ADMIN_LNAME || "User"
};

async function createAdmin() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("Missing MONGO_URI in .env file");
    }

    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: ADMIN_CONFIG.email.toLowerCase().trim() 
    });

    if (existingAdmin) {
      if (existingAdmin.role === "admin") {
        console.log(`⚠️  Admin user already exists with email: ${ADMIN_CONFIG.email}`);
        console.log("   Skipping creation...");
        await mongoose.disconnect();
        return;
      } else {
        // Update existing user to admin
        console.log(`📝 Updating existing user to admin role...`);
        const hashedPassword = await bcrypt.hash(ADMIN_CONFIG.password, 10);
        existingAdmin.password = hashedPassword;
        existingAdmin.role = "admin";
        existingAdmin.active = 1;
        await existingAdmin.save();
        console.log("✅ User updated to admin successfully!");
        await mongoose.disconnect();
        return;
      }
    }

    // Validate password
    const passwordErrors = [];
    if (ADMIN_CONFIG.password.length < 8) {
      passwordErrors.push("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(ADMIN_CONFIG.password)) {
      passwordErrors.push("Password must contain uppercase letter");
    }
    if (!/[a-z]/.test(ADMIN_CONFIG.password)) {
      passwordErrors.push("Password must contain lowercase letter");
    }
    if (!/[0-9]/.test(ADMIN_CONFIG.password)) {
      passwordErrors.push("Password must contain number");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(ADMIN_CONFIG.password)) {
      passwordErrors.push("Password must contain special character");
    }

    if (passwordErrors.length > 0) {
      console.error("❌ Password validation failed:");
      passwordErrors.forEach(err => console.error(`   - ${err}`));
      await mongoose.disconnect();
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_CONFIG.password, 10);

    // Create admin user
    const adminUser = await User.create({
      f_name: ADMIN_CONFIG.f_name,
      l_name: ADMIN_CONFIG.l_name,
      email: ADMIN_CONFIG.email.toLowerCase().trim(),
      password: hashedPassword,
      role: "admin",
      active: 1,
      created_date: new Date()
    });

    console.log("\n✅ Admin user created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📧 Email:    ${adminUser.email}`);
    console.log(`👤 Name:     ${adminUser.f_name} ${adminUser.l_name}`);
    console.log(`🔑 Role:     ${adminUser.role}`);
    console.log(`🆔 User ID:  ${adminUser._id}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n💡 Login credentials:");
    console.log(`   Email: ${ADMIN_CONFIG.email}`);
    console.log(`   Password: ${ADMIN_CONFIG.password}`);
    console.log("\n⚠️  Remember to change the default password after first login!");

    // Disconnect
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");

  } catch (error) {
    console.error("\n❌ Error creating admin user:");
    console.error(error.message);
    if (error.code === 11000) {
      console.error("   Email already exists in database");
    }
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

// Run the script
createAdmin();

