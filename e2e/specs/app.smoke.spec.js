const { test, expect } = require("../fixtures/electronApp.fixture");

test("Query Editor empty state is visible without profiles", async ({ page }) => {
  await expect(page.getByLabel("Query editor empty state")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create Profile" })).toBeVisible();
});