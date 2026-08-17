import path from "node:path";
import { loadSharedConfigFiles } from "@smithy/shared-ini-file-loader";
import type { AwsCredentialProfile } from "../../domain/entities/AwsCredentialProfile";
import type { AwsCredentialProfileRepository as AwsCredentialProfileRepositoryPort } from "../../domain/repositories/AwsCredentialProfileRepository";

export class AwsCredentialProfileRepository implements AwsCredentialProfileRepositoryPort {
  async listProfiles(directoryPath?: string): Promise<AwsCredentialProfile[]> {
    try {
      const sharedConfigFiles = await this.loadConfigFiles(directoryPath);
      const profileNames = new Set<string>();

      for (const profileName of Object.keys(sharedConfigFiles.credentialsFile)) {
        if (this.isProfileName(profileName)) {
          profileNames.add(profileName);
        }
      }

      for (const profileName of Object.keys(sharedConfigFiles.configFile)) {
        if (this.isProfileName(profileName)) {
          profileNames.add(profileName);
        }
      }

      return Array.from(profileNames)
        .map((name) => ({
          name,
          region:
            sharedConfigFiles.configFile[name]?.region ??
            sharedConfigFiles.credentialsFile[name]?.region,
        }))
        .sort((left, right) => {
          if (left.name === "default") {
            return -1;
          }

          if (right.name === "default") {
            return 1;
          }

          return left.name.localeCompare(right.name);
        });
    } catch (error) {
      if (directoryPath != null) {
        throw error;
      }

      console.error("Failed to load AWS credential profiles", error);
      return [];
    }
  }

  private async loadConfigFiles(directoryPath?: string) {
    if (directoryPath == null) {
      return loadSharedConfigFiles({ ignoreCache: true });
    }

    const trimmedDirectoryPath = directoryPath.trim();
    if (trimmedDirectoryPath.length === 0) {
      throw new Error("AWS credentials directory path is empty.");
    }

    return loadSharedConfigFiles({
      filepath: path.join(trimmedDirectoryPath, "credentials"),
      configFilepath: path.join(trimmedDirectoryPath, "config"),
      ignoreCache: true,
    });
  }

  private isProfileName(profileName: string): boolean {
    return profileName !== "sso-session" && profileName !== "services";
  }
}
