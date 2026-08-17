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

module.exports = {
  seedProfiles,
  seedBrokenProfilesJson,
};