const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth");
//const recipeRoutes = require("./routes/recipes");

const app = express();

// Middleware
app.use(cors());
// Configure body parser with size limits (10kb for auth endpoints, 1mb for others)
app.use(express.json({ limit: "1mb" }));

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Optional explicit root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

// API routes
app.use("/api/auth", authRoutes);
const adminRoutes = require("./routes/admin");
app.use("/api/admin", adminRoutes);

// Recipe routes (protected)
const recipeRoutes = require("./routes/Recipe");
app.use("/api/recipes", recipeRoutes);

// Handle 404 for unknown routes  
app.use((req, res) => {
  console.log(req, res)
  res.status(404).send('Page Not Found');
});

module.exports = app;

