import { Button } from "@/components/ui/button";
import type React from "react";
import { useTranslation } from "react-i18next";

type AppTopbarProps = {
  pageTitle: string;
  showProfileActions: boolean;
  canPrimaryAction: boolean;
  canTestConnection: boolean;
  primaryActionMessage: string | null;
  primaryActionSuccess: boolean | null;
  isPrimaryActionLoading: boolean;
  primaryActionLabel: string;
  primaryActionLoadingLabel: string;
  isTestingConnection: boolean;
  testConnectionMessage: string | null;
  testConnectionSuccess: boolean | null;
  showDeleteAction?: boolean;
  isDeleteActionLoading?: boolean;
  onDeleteAction?: () => void;
  onPrimaryAction: () => void;
  onTestConnection: () => void;
};

export function AppTopbar({
  pageTitle,
  showProfileActions,
  canPrimaryAction,
  canTestConnection,
  primaryActionMessage,
  primaryActionSuccess,
  isPrimaryActionLoading,
  primaryActionLabel,
  primaryActionLoadingLabel,
  isTestingConnection,
  testConnectionMessage,
  testConnectionSuccess,
  showDeleteAction = false,
  isDeleteActionLoading = false,
  onDeleteAction,
  onPrimaryAction,
  onTestConnection,
}: AppTopbarProps): React.JSX.Element {
  const { t } = useTranslation();
  const shouldShowActions = showProfileActions;

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-[#f3fbfc] px-8">
      <div className="flex min-w-0 items-center gap-2">
        {!shouldShowActions ? (
          <h1 className="stitch-headline-md text-slate-900" id="page-title">
            {pageTitle}
          </h1>
        ) : (
          <div aria-hidden="true" className="h-6 w-6" />
        )}
      </div>

      <div className="flex items-center gap-2">
        {shouldShowActions ? (
          <>
            {showProfileActions ? (
              <>
                {primaryActionMessage != null ? (
                  <p
                    data-testid="primary-action-message"
                    className={`stitch-body-sm ${primaryActionSuccess ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {primaryActionMessage}
                  </p>
                ) : testConnectionMessage != null ? (
                  <p
                    data-testid="test-connection-message"
                    className={`stitch-body-sm ${testConnectionSuccess ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {testConnectionMessage}
                  </p>
                ) : null}
                <Button
                  data-testid="test-connection-button"
                  variant="outline"
                  size="sm"
                  disabled={!canTestConnection || isTestingConnection}
                  onClick={onTestConnection}
                  className="h-9 rounded border border-[#bac9cc] bg-white px-4 text-[12px] font-semibold text-[#151d1e] hover:bg-[#e8eff1]"
                  type="button"
                >
                  {isTestingConnection ? t("profile.testing") : t("profile.testConnection")}
                </Button>
                {showDeleteAction ? (
                  <Button
                    data-testid="delete-profile-button"
                    variant="outline"
                    size="sm"
                    disabled={isDeleteActionLoading}
                    onClick={onDeleteAction}
                    className="h-9 rounded border border-[#ba1a1a] bg-white px-4 text-[12px] font-semibold text-[#ba1a1a] hover:bg-red-50 hover:text-[#ba1a1a]"
                    type="button"
                  >
                    {t("profile.delete")}
                  </Button>
                ) : null}
                <Button
                  data-testid="primary-action-button"
                  size="sm"
                  disabled={!canPrimaryAction || isPrimaryActionLoading}
                  onClick={onPrimaryAction}
                  className="h-9 rounded bg-[#006875] px-6 text-[12px] font-semibold text-white hover:bg-[#004f58]"
                  type="button"
                >
                  {isPrimaryActionLoading ? primaryActionLoadingLabel : primaryActionLabel}
                </Button>
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </header>
  );
}
