import type { Settings } from "../../domain/entities/Settings";
import type { SettingsRepository } from "../../domain/repositories/SettingsRepository";

export class SaveSettingsUseCase {
  constructor(private readonly repository: SettingsRepository) {}

  async execute(settings: Settings): Promise<void> {
    if (settings.language !== "en") {
      throw new Error(`Unsupported language: "${settings.language}"`);
    }
    await this.repository.save(settings);
  }
}
