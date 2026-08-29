const { seedProfileWithMissingCredentialsDirectory } = require("../helpers/profile");
const { test, expect } = require("../fixtures/electronApp.fixture");

const credentialsNotReadableMessage =
  "Could not read AWS credentials. Ensure the selected credentials directory contains a readable credentials or config file.";

test("runs a query with Ctrl/Cmd+Enter while the SQL editor is focused", async ({
  page,
  userDataDir,
}) => {
  await seedProfileWithMissingCredentialsDirectory(userDataDir);
  await page.reload();

  await expect(page.getByTestId("error-dialog")).toBeVisible();
  await page.getByTestId("dialog-close-button").click();
  await expect(page.getByTestId("error-dialog")).toBeHidden();

  const sqlEditor = page.locator(".monaco-editor");
  await sqlEditor.click();
  await page.keyboard.type("SELECT 1");
  await page.keyboard.press(`${process.platform === "darwin" ? "Meta" : "Control"}+Enter`);

  await expect(page.getByTestId("error-dialog")).toBeVisible();
  await expect(page.getByText(credentialsNotReadableMessage)).toBeVisible();
});
