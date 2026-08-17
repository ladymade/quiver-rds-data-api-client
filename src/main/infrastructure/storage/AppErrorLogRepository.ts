import fs from "node:fs/promises";
import path from "node:path";
import { app } from "electron";

type AppErrorLogEntry = {
  timestamp: string;
  source: string;
  message: string;
  stack?: string;
  metadata?: string;
};

export class AppErrorLogRepository {
  private readonly filePath: string;

  constructor() {
    this.filePath = path.join(app.getPath("userData"), "logs", "errors.log");
  }

  async append(entry: AppErrorLogEntry): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.appendFile(this.filePath, `${JSON.stringify(entry)}\n`, "utf-8");
  }
}
