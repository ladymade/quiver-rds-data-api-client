const fs = require("node:fs/promises");
const path = require("node:path");

async function seedProfiles(userDataDir, profiles) {
  const profilePath = path.join(userDataDir, "profiles.json");
  await fs.mkdir(path.dirname(profilePath), { recursive: true });
  await fs.writeFile(profilePath, JSON.stringify(profiles, null, 2), "utf-8");
}

async function seedBrokenProfilesJson(userDataDir) {
  const profilePath = path.join(userDataDir, "profiles.json");
  await fs.mkdir(path.dirname(profilePath), { recursive: true });
  await fs.writeFile(profilePath, "{broken-json", "utf-8");
}

async function seedProfileWithMissingCredentialsDirectory(userDataDir) {
  const missingCredentialsDirectory = path.join(userDataDir, "missing-aws-credentials");
  await seedProfiles(userDataDir, [
    {
      name: "missing-credentials-profile",
      credentialProfileName: "default",
      region: "ap-northeast-1",
      credentialsDirectory: missingCredentialsDirectory,
      clusterArn: "arn:aws:rds:ap-northeast-1:123456789012:cluster:missing-credentials",
      secretArn: "arn:aws:secretsmanager:ap-northeast-1:123456789012:secret:missing-credentials",
      database: "app",
      engine: "postgresql",
    },
  ]);

  return missingCredentialsDirectory;
}

module.exports = {
  seedProfiles,
  seedBrokenProfilesJson,
  seedProfileWithMissingCredentialsDirectory,
};