const { seedBrokenProfilesJson } = require("../helpers/profile");
const { test, expect } = require("../fixtures/electronApp.fixture");

test("broken profiles json shows unexpected error dialog", async ({ page, userDataDir }) => {
  await seedBrokenProfilesJson(userDataDir);
  await page.reload();
  await expect(page.getByTestId("error-dialog")).toBeVisible();
  await expect(page.getByText("Execution Error")).toBeVisible();
  await expect(page.getByText("An unexpected error occurred.")).toBeVisible();
});