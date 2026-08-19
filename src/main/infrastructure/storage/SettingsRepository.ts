import fs from "node:fs/promises";
import path from "node:path";
import { app } from "electron";
import type { Settings } from "../../domain/entities/Settings";
import type { SettingsRepository as SettingsRepositoryPort } from "../../domain/repositories/SettingsRepository";

const DEFAULT_SETTINGS: Settings = { language: "en" };

export class SettingsRepository implements SettingsRepositoryPort {
  private readonly filePath: string;

  constructor() {
    this.filePath = path.join(app.getPath("userData"), "settings.json");
  }

  async get(): Promise<Settings> {
    try {
      const content = await fs.readFile(this.filePath, "utf-8");
      return JSON.parse(content) as Settings;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return DEFAULT_SETTINGS;
      }
      throw error;
    }
  }

  async save(settings: Settings): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(settings, null, 2), "utf-8");
  }
}
