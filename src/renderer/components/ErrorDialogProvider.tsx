import { createContext, useMemo, useState } from "react";
import type React from "react";
import { ErrorDialog } from "./ErrorDialog";

type ErrorDialogContextValue = {
  showErrorDialog: (title: string, message: string, details?: string) => void;
};

export const ErrorDialogContext = createContext<ErrorDialogContextValue | null>(null);

type ErrorDialogProviderProps = {
  children: React.ReactNode;
};

export function ErrorDialogProvider({ children }: ErrorDialogProviderProps): React.JSX.Element {
  const [dialogState, setDialogState] = useState<{
    title: string;
    message: string;
    details?: string;
  } | null>(null);

  const contextValue = useMemo(
    () => ({
      showErrorDialog: (title: string, message: string, details?: string) => {
        setDialogState({ title, message, details });
      },
    }),
    []
  );

  return (
    <ErrorDialogContext.Provider value={contextValue}>
      {children}
      {dialogState != null ? (
        <ErrorDialog
          details={dialogState.details}
          message={dialogState.message}
          onClose={() => setDialogState(null)}
          title={dialogState.title}
        />
      ) : null}
    </ErrorDialogContext.Provider>
  );
}
