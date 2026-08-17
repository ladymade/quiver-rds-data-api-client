import { useContext } from "react";
import { LoadingOverlayContext } from "../components/LoadingOverlayProvider";

export function useLoadingOverlay(): {
  beginLoading: (message?: string) => () => void;
} {
  const context = useContext(LoadingOverlayContext);

  if (context == null) {
    throw new Error("useLoadingOverlay must be used within a LoadingOverlayProvider");
  }

  return context;
}
