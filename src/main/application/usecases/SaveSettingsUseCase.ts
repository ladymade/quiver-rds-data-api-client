import type { Settings } from "../../domain/entities/Settings";
import type { SettingsRepository } from "../../domain/repositories/SettingsRepository";

const SUPPORTED_LANGUAGES = new Set(["en", "ja", "zh-CN"]);

export class SaveSettingsUseCase {
  constructor(private readonly repository: SettingsRepository) {}

  async execute(settings: Settings): Promise<void> {
    if (!SUPPORTED_LANGUAGES.has(settings.language)) {
      throw new Error(`Unsupported language: "${settings.language}"`);
    }
    await this.repository.save(settings);
  }
}
