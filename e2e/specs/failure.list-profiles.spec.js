const {
  seedBrokenProfilesJson,
  seedProfileWithMissingCredentialsDirectory,
} = require("../helpers/profile");
const { test, expect } = require("../fixtures/electronApp.fixture");

const credentialsNotReadableMessage =
  "Could not read AWS credentials. Ensure the selected credentials directory contains a readable credentials or config file.";

test("broken profiles json shows unexpected error dialog", async ({ page, userDataDir }) => {
  await seedBrokenProfilesJson(userDataDir);
  await page.reload();
  await expect(page.getByTestId("error-dialog")).toBeVisible();
  await expect(page.getByText("Execution Error")).toBeVisible();
  await expect(page.getByText("An unexpected error occurred.")).toBeVisible();
});

test("missing selected credentials directory shows readable credentials error", async ({
  page,
  userDataDir,
}) => {
  const missingCredentialsDirectory = await seedProfileWithMissingCredentialsDirectory(userDataDir);

  await page.reload();

  await expect(page.getByTestId("error-dialog")).toBeVisible();
  await expect(page.getByText(credentialsNotReadableMessage)).toBeVisible();

  const queryResult = await page.evaluate(
    async ({ credentialsDirectory }) => {
      return window.quiverApi.executeQuery({
        profileName: "default",
        region: "ap-northeast-1",
        credentialsDirectory,
        resourceArn: "arn:aws:rds:ap-northeast-1:123456789012:cluster:missing-credentials",
        secretArn: "arn:aws:secretsmanager:ap-northeast-1:123456789012:secret:missing-credentials",
        database: "app",
        sql: "SELECT 1",
      });
    },
    { credentialsDirectory: missingCredentialsDirectory }
  );

  expect(queryResult.success).toBe(false);
  expect(queryResult.error.message).toBe(credentialsNotReadableMessage);
});