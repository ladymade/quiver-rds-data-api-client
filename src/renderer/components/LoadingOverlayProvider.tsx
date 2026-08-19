import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { LoadingOverlay } from "./LoadingOverlay";

type LoadingOverlayContextValue = {
  beginLoading: (message?: string) => () => void;
};

const SHOW_DELAY_MS = 150;
const MIN_VISIBLE_MS = 250;

export const LoadingOverlayContext = createContext<LoadingOverlayContextValue | null>(null);

type LoadingOverlayProviderProps = {
  children: React.ReactNode;
};

export function LoadingOverlayProvider({
  children,
}: LoadingOverlayProviderProps): React.JSX.Element {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const pendingCountRef = useRef(0);
  const isVisibleRef = useRef(false);
  const visibleSinceRef = useRef(0);
  const showTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const clearShowTimer = useCallback((): void => {
    if (showTimerRef.current != null) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  }, []);

  const clearHideTimer = useCallback((): void => {
    if (hideTimerRef.current != null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  const beginLoading = useCallback(
    (nextMessage?: string) => {
      let stopped = false;

      pendingCountRef.current += 1;
      setMessage(nextMessage);
      clearHideTimer();

      if (!isVisibleRef.current && showTimerRef.current == null) {
        showTimerRef.current = window.setTimeout(() => {
          showTimerRef.current = null;
          if (pendingCountRef.current > 0) {
            visibleSinceRef.current = Date.now();
            isVisibleRef.current = true;
            setIsVisible(true);
          }
        }, SHOW_DELAY_MS);
      }

      return () => {
        if (stopped) {
          return;
        }

        stopped = true;
        pendingCountRef.current = Math.max(0, pendingCountRef.current - 1);

        if (pendingCountRef.current > 0) {
          return;
        }

        clearShowTimer();

        if (!isVisibleRef.current) {
          return;
        }

        const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - visibleSinceRef.current));
        hideTimerRef.current = window.setTimeout(() => {
          hideTimerRef.current = null;
          if (pendingCountRef.current === 0) {
            isVisibleRef.current = false;
            setIsVisible(false);
          }
        }, remaining);
      };
    },
    [clearHideTimer, clearShowTimer]
  );

  useEffect(() => {
    return () => {
      clearShowTimer();
      clearHideTimer();
    };
  }, [clearHideTimer, clearShowTimer]);

  const contextValue = useMemo(
    () => ({
      beginLoading,
    }),
    [beginLoading]
  );

  return (
    <LoadingOverlayContext.Provider value={contextValue}>
      {children}
      {isVisible ? <LoadingOverlay message={message} /> : null}
    </LoadingOverlayContext.Provider>
  );
}
