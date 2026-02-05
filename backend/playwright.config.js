const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./frontend-tests",
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:5000",
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000
  },
  webServer: {
    command: "npm start",
    url: "http://127.0.0.1:5000",
    reuseExistingServer: true,
    timeout: 120000
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } }
  ]
});
