require("../helpers/testSetup");
const { expect } = require("chai");
const request = require("supertest");
const app = require("../../app");
const User = require("../../models/User");
const Recipe = require("../../models/Recipe");
const Category = require("../../models/Category");
const { createTestUser, createTestAdmin, createTestRecipe, generateToken } = require("../helpers/testSetup");

describe("Admin Routes (API)", function() {
  let adminToken, userToken, adminUser, regularUser, recipe;

  beforeEach(async function() {
    adminUser = await createTestAdmin();
    regularUser = await createTestUser();
    adminToken = generateToken(adminUser._id, "admin");
    userToken = generateToken(regularUser._id, "user");
    recipe = await createTestRecipe(regularUser._id, { title: "Admin Test Recipe" });
  });

  describe("Admin auth endpoints", function() {
    it("GET /api/auth/admin/me returns admin user", async function() {
      const res = await request(app)
        .get("/api/auth/admin/me")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).to.have.property("role", "admin");
      expect(res.body).to.have.property("email", adminUser.email);
    });

    it("GET /api/auth/admin/me blocks non-admin", async function() {
      await request(app)
        .get("/api/auth/admin/me")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(403);
    });

    it("POST /api/auth/admin/login succeeds for admin", async function() {
      const res = await request(app)
        .post("/api/auth/admin/login")
        .send({ email: adminUser.email, password: "Test123!@#" })
        .expect(200);

      expect(res.body).to.have.property("token");
    });

    it("POST /api/auth/admin/login blocks regular user", async function() {
      await request(app)
        .post("/api/auth/admin/login")
        .send({ email: regularUser.email, password: "Test123!@#" })
        .expect(403);
    });
  });

  describe("Admin user management", function() {
    it("GET /api/users/admin/all returns list for admin", async function() {
      const res = await request(app)
        .get("/api/users/admin/all")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.users).to.be.an("array");
    });

    it("GET /api/users/admin/all blocks non-admin", async function() {
      await request(app)
        .get("/api/users/admin/all")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(403);
    });

    it("PUT /api/users/admin/:id/status deactivates user", async function() {
      const res = await request(app)
        .put(`/api/users/admin/${regularUser._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ active: false })
        .expect(200);

      expect(res.body.user.active).to.equal(0);
    });

    it("PUT /api/users/admin/:id/status blocks admin target", async function() {
      await request(app)
        .put(`/api/users/admin/${adminUser._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ active: false })
        .expect(403);
    });

    it("DELETE /api/users/admin/:id soft deletes user", async function() {
      await request(app)
        .delete(`/api/users/admin/${regularUser._id}?hard=false`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const updated = await User.findById(regularUser._id);
      expect(updated.deletedAt).to.exist;
      expect(updated.active).to.equal(0);
    });
  });

  describe("Admin recipe management", function() {
    it("GET /api/recipes/admin/all returns recipes", async function() {
      const res = await request(app)
        .get("/api/recipes/admin/all")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.recipes).to.be.an("array");
    });

    it("DELETE /api/recipes/admin/:id soft deletes recipe", async function() {
      await request(app)
        .delete(`/api/recipes/admin/${recipe._id}?mode=soft`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const updated = await Recipe.findById(recipe._id);
      expect(updated.deletedAt).to.exist;
    });
  });

  describe("Admin category management", function() {
    it("CRUD category with admin token", async function() {
      const createRes = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Admin Test Category",
          description: "Category for admin tests",
          isActive: true
        })
        .expect(201);

      const categoryId = createRes.body.category._id;

      const listRes = await request(app)
        .get("/api/categories/admin")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(listRes.body.categories).to.be.an("array");

      await request(app)
        .delete(`/api/categories/${categoryId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const removed = await Category.findById(categoryId);
      expect(removed).to.be.null;
    });
  });

  describe("Admin analytics", function() {
    it("GET /api/admin/analytics/overview returns metrics", async function() {
      const res = await request(app)
        .get("/api/admin/analytics/overview")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).to.have.property("users");
      expect(res.body).to.have.property("recipes");
    });
  });
});
