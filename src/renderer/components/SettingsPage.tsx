import type React from "react";
import { useEffect, useState } from "react";
import type { AppLanguage } from "../../shared/types/ipc";
import { useErrorDialog } from "../hooks/useErrorDialog";
import { useLoadingOverlay } from "../hooks/useLoadingOverlay";
import { useUnexpectedErrorHandler } from "../hooks/useUnexpectedErrorHandler";

type SettingsPageProps = Readonly<Record<string, never>>;

export function SettingsPage(_props: SettingsPageProps): React.JSX.Element {
  const [language, setLanguage] = useState<AppLanguage>("en");
  const [isSaving, setIsSaving] = useState(false);
  const { showErrorDialog } = useErrorDialog();
  const { beginLoading } = useLoadingOverlay();
  const { showUnexpectedError } = useUnexpectedErrorHandler();

  useEffect(() => {
    if (!window.quiverApi) {
      return;
    }

    void window.quiverApi
      .getSettings()
      .then((result) => {
        setLanguage(result.settings.language);
      })
      .catch((error) => {
        showUnexpectedError(error, "renderer:get-settings");
      });
  }, [showUnexpectedError]);

  const handleSave = async (): Promise<void> => {
    if (!window.quiverApi || isSaving) {
      return;
    }

    setIsSaving(true);
    const stopLoading = beginLoading("Saving settings...");

    try {
      const result = await window.quiverApi.saveSettings({ language });
      if (!result.success) {
        showErrorDialog(
          "Failed to save settings",
          result.errorMessage ?? "An unknown error occurred.",
          undefined
        );
      }
    } catch (error) {
      showUnexpectedError(error, "renderer:save-settings");
    } finally {
      stopLoading();
      setIsSaving(false);
    }
  };

  return (
    <section className="flex h-full flex-col" aria-labelledby="settings-page-title">
      <header className="sticky top-0 z-20 flex h-16 w-full shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-white px-8">
        <div className="flex items-center gap-4" />
        <button
          className="rounded bg-[#006875] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#004f58] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSaving}
          onClick={() => {
            void handleSave();
          }}
          type="button"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </header>

      <div className="flex-grow overflow-y-auto p-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-[#151d1e]" id="settings-page-title">
              Settings
            </h2>
            <p className="mt-1 text-sm text-[#3b494c]">
              Manage your application preferences and configuration.
            </p>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <h2 className="mb-6 border-b border-[#E2E8F0] pb-4 text-lg font-semibold text-[#151d1e]">
              General Settings
            </h2>

            <div>
              <label
                className="mb-2 block text-xs font-semibold text-[#3b494c]"
                htmlFor="language-select"
              >
                Language Selection
              </label>
              <div className="relative w-64">
                <select
                  className="h-10 w-full cursor-pointer appearance-none rounded border border-[#E2E8F0] bg-white px-3 text-sm text-[#151d1e] transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#006875]"
                  id="language-select"
                  onChange={(event) => {
                    setLanguage(event.target.value as AppLanguage);
                  }}
                  value={language}
                >
                  <option value="en">English</option>
                </select>
              </div>
              <p className="mt-2 text-sm text-[#3b494c]">
                Select the default language for the application interface.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
