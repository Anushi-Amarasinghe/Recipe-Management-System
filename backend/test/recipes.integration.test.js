const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../app");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

let mongoServer;
let token;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create test user
  const user = await User.create({
    f_name: "Test",
    l_name: "User",
    email: "test@test.com",
    password: "hashedpassword", // not used directly
    active: 1
  });

  // Generate valid JWT
  token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("RECIPES API – Integration Tests", () => {

  test("201 – Create recipe (SUCCESS)", async () => {
    const res = await request(app)
      .post("/api/recipes")
      .set("Authorization", "Bearer " + token)
      .send({
        title: "Test Recipe",
        ingredients: ["Eggs", "Milk"],
        instructions: [
          { stepNumber: 1, text: "Mix ingredients" }
        ]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Test Recipe");
  });

  test("400 – Create recipe (INVALID DATA)", async () => {
    const res = await request(app)
      .post("/api/recipes")
      .set("Authorization", "Bearer " + token)
      .send({
        // Missing title
        ingredients: ["Eggs"]
      });

    expect(res.statusCode).toBe(400);
  });

  test("401 – Create recipe (UNAUTHORIZED)", async () => {
    const res = await request(app)
      .post("/api/recipes")
      .send({
        title: "No Auth Recipe",
        ingredients: ["Eggs"],
        instructions: [{ stepNumber: 1, text: "Cook" }]
      });

    expect(res.statusCode).toBe(401);
  });

  test("401 – Get my recipes (NO TOKEN)", async () => {
    const res = await request(app)
      .get("/api/recipes");

    expect(res.statusCode).toBe(401);
  });

});
