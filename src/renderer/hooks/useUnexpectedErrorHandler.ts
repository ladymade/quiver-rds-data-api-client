import { useCallback } from "react";
import { useErrorDialog } from "./useErrorDialog";

const UNEXPECTED_ERROR_MESSAGE = "予期せぬエラーが発生しました。";

function normalizeUnknownError(error: unknown): {
  message: string;
  stack?: string;
  metadata?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message || "Unexpected error",
      stack: error.stack,
    };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  if (error != null) {
    try {
      return {
        message: "Unexpected non-Error value",
        metadata: JSON.stringify(error),
      };
    } catch {
      return {
        message: "Unexpected non-Error value",
        metadata: String(error),
      };
    }
  }

  return { message: "Unknown error" };
}

export function useUnexpectedErrorHandler(): {
  showUnexpectedError: (error: unknown, source: string) => void;
} {
  const { showErrorDialog } = useErrorDialog();

  const showUnexpectedError = useCallback(
    (error: unknown, source: string) => {
      const normalized = normalizeUnknownError(error);
      void window.quiverApi?.logUnexpectedError({
        source,
        message: normalized.message,
        stack: normalized.stack,
        metadata: normalized.metadata,
      });
      showErrorDialog("Execution Error", UNEXPECTED_ERROR_MESSAGE);
    },
    [showErrorDialog]
  );

  return { showUnexpectedError };
}
