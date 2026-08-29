import { constants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

export const AWS_CREDENTIALS_NOT_READABLE_MESSAGE =
  "Could not read AWS credentials. Ensure the selected credentials directory contains a readable credentials or config file.";

export class AwsCredentialsNotReadableError extends Error {
  readonly cause?: unknown;

  constructor(cause?: unknown) {
    super(AWS_CREDENTIALS_NOT_READABLE_MESSAGE);
    this.name = "AwsCredentialsNotReadableError";
    this.cause = cause;
  }
}

export function isAwsCredentialsNotReadableError(
  error: unknown
): error is AwsCredentialsNotReadableError {
  return error instanceof AwsCredentialsNotReadableError;
}

export function toAwsCredentialsNotReadableError(error: unknown): AwsCredentialsNotReadableError {
  if (isAwsCredentialsNotReadableError(error)) {
    return error;
  }

  return new AwsCredentialsNotReadableError(error);
}

export async function assertAwsCredentialsDirectoryReadable(directoryPath: string): Promise<void> {
  const trimmedDirectoryPath = directoryPath.trim();
  if (trimmedDirectoryPath.length === 0) {
    throw new AwsCredentialsNotReadableError(new Error("AWS credentials directory path is empty."));
  }

  const credentialsPath = path.join(trimmedDirectoryPath, "credentials");
  const configPath = path.join(trimmedDirectoryPath, "config");
  const hasReadableCredentialsFile = await canReadFile(credentialsPath);
  const hasReadableConfigFile = await canReadFile(configPath);

  if (!hasReadableCredentialsFile && !hasReadableConfigFile) {
    throw new AwsCredentialsNotReadableError();
  }
}

async function canReadFile(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}
