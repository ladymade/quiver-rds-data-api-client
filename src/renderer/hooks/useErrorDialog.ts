import { useContext } from "react";
import { ErrorDialogContext } from "../components/ErrorDialogProvider";

export function useErrorDialog(): {
  showErrorDialog: (title: string, message: string, details?: string) => void;
} {
  const context = useContext(ErrorDialogContext);

  if (context == null) {
    throw new Error("useErrorDialog must be used within an ErrorDialogProvider");
  }

  return context;
}
