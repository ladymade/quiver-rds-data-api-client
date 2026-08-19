import type React from "react";
import { useTranslation } from "react-i18next";

type LoadingOverlayProps = {
  message?: string;
};

export function LoadingOverlay({ message }: LoadingOverlayProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0E21]/60 backdrop-blur-md">
      <div className="z-10 flex min-w-[240px] flex-col items-center justify-center gap-4 px-8 py-6">
        <div className="relative h-1.5 w-[200px] overflow-hidden rounded-full bg-white/10 shadow-sm">
          <span className="stitch-loading-bar absolute left-0 top-0 h-full w-1/2 rounded-full" />
        </div>
        <p className="stitch-code-md animate-pulse tracking-[0.2em] text-[#E0E3FF]/85 uppercase">
          {message ?? t("common.loading")}
        </p>
      </div>
    </div>
  );
}
