import fs from "node:fs/promises";
import path from "node:path";
import { app } from "electron";
import type { ConnectionProfile } from "../../domain/entities/ConnectionProfile";
import type { ConnectionProfileRepository as ConnectionProfileRepositoryPort } from "../../domain/repositories/ConnectionProfileRepository";

export class ConnectionProfileRepository implements ConnectionProfileRepositoryPort {
  private readonly filePath: string;

  constructor() {
    this.filePath = path.join(app.getPath("userData"), "profiles.json");
  }

  async list(): Promise<ConnectionProfile[]> {
    return this.readFile();
  }

  async existsByName(name: string): Promise<boolean> {
    const profiles = await this.readFile();
    return profiles.some((p) => p.name === name);
  }

  async save(profile: ConnectionProfile): Promise<void> {
    const profiles = await this.readFile();
    profiles.push(profile);
    await this.writeFile(profiles);
  }

  async replaceAll(profiles: ConnectionProfile[]): Promise<void> {
    await this.writeFile(profiles);
  }

  private async writeFile(profiles: ConnectionProfile[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(profiles, null, 2), "utf-8");
  }

  private async readFile(): Promise<ConnectionProfile[]> {
    try {
      const content = await fs.readFile(this.filePath, "utf-8");
      return JSON.parse(content) as ConnectionProfile[];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }
}
