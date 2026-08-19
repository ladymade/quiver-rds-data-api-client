const { test, expect } = require("../fixtures/electronApp.fixture");

test("settings changes the interface language immediately and persists it", async ({ page }) => {
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.locator("#language-select")).toHaveValue("en");

  await page.locator("#language-select").selectOption("ja");
  await page.getByRole("button", { name: "Save Settings" }).click();
  await expect(page.getByRole("button", { name: "クエリエディター" })).toBeVisible();
  await expect(page.getByRole("button", { name: "設定を保存" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "クエリエディター" })).toBeVisible();

  await page.getByRole("button", { name: "設定" }).click();
  await page.locator("#language-select").selectOption("zh-CN");
  await page.getByRole("button", { name: "設定を保存" }).click();
  await expect(page.getByRole("button", { name: "查询编辑器" })).toBeVisible();
  await expect(page.getByRole("button", { name: "保存设置" })).toBeVisible();
});