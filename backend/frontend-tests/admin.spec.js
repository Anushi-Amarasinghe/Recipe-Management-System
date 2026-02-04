const { test, expect } = require("@playwright/test");

const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
const userPassword = "User123!";

const uniqueId = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

async function getAdminToken(request) {
  const res = await request.post("/api/auth/admin/login", {
    data: { email: adminEmail, password: adminPassword }
  });
  const data = await res.json();
  return data.token;
}

async function setToken(page, token) {
  await page.addInitScript((t) => {
    localStorage.setItem("token", t);
  }, token);
}

async function createUser(request, email) {
  await request.post("/api/auth/register", {
    data: {
      f_name: "Test",
      l_name: "User",
      email,
      password: userPassword,
      confirm_password: userPassword
    }
  });
  const loginRes = await request.post("/api/auth/login", {
    data: { email, password: userPassword }
  });
  const loginData = await loginRes.json();
  return loginData.token;
}

async function createRecipe(request, token, title) {
  await request.post("/api/recipes", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      title,
      description: "Automated test recipe",
      category: "Dinner",
      rating: 4,
      ingredients: ["salt"],
      instructions: ["mix"]
    }
  });
}

async function openUsersPage(page) {
  await page.goto("/admin-dashboard.html");
  await page.waitForSelector("text=Manage Users");
  await page.waitForSelector("#userSearchInput");
}

async function openCategoriesPage(page) {
  await page.goto("/admin-dashboard.html");
  await page.click("button#adminCategoriesBtn");
  await page.waitForSelector("text=Manage Categories");
  await page.waitForSelector("#categorySearchInput");
}

async function openRecipesPage(page) {
  await page.goto("/admin-dashboard.html");
  await page.click("button#adminRecipesBtn");
  await page.waitForSelector("text=Manage Recipes");
  await page.waitForSelector("#recipeSearchInput");
}

async function openInsightsPage(page) {
  await page.goto("/admin-dashboard.html");
  await page.click("button#adminAnalyticsBtn");
  await page.waitForSelector("text=Admin Insights");
}

test.describe.configure({ mode: "serial" });

test.describe("Admin UI flows", () => {
  test.beforeEach(async ({ page, request }) => {
    const token = await getAdminToken(request);
    await setToken(page, token);
  });

  test("admin login and dashboard loads", async ({ page, request }) => {
    await page.goto("/admin-login.html");
    await page.fill("#email", adminEmail);
    await page.fill("#password", adminPassword);
    await page.click("button[type=\"submit\"]");
    await page.waitForURL("**/admin-dashboard.html");
    await expect(page.locator("#adminUsersBtn")).toBeVisible();
  });

  test("manage users table loads", async ({ page }) => {
    await openUsersPage(page);
    await expect(page.locator("#usersTableWrap")).toBeVisible();
  });

  test("manage categories table loads", async ({ page }) => {
    await openCategoriesPage(page);
    await expect(page.locator("#categoriesTableWrap")).toBeVisible();
  });

  test("manage recipes table loads", async ({ page }) => {
    await openRecipesPage(page);
    await expect(page.locator("#recipesTableWrap")).toBeVisible();
  });

  test("insights charts render", async ({ page }) => {
    await openInsightsPage(page);
    await expect(page.locator("#userTrendChart")).toBeVisible();
    await expect(page.locator("#recipeTrendChart")).toBeVisible();
  });
});
