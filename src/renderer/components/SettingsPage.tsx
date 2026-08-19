import { Button } from "@/components/ui/button";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AppLanguage } from "../../shared/types/ipc";
import { useErrorDialog } from "../hooks/useErrorDialog";
import { useLoadingOverlay } from "../hooks/useLoadingOverlay";
import { useUnexpectedErrorHandler } from "../hooks/useUnexpectedErrorHandler";

type SettingsPageProps = Readonly<Record<string, never>>;

export function SettingsPage(_props: SettingsPageProps): React.JSX.Element {
  const [language, setLanguage] = useState<AppLanguage>("en");
  const [isSaving, setIsSaving] = useState(false);
  const { i18n, t } = useTranslation();
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
    const stopLoading = beginLoading(t("settings.savingOverlay"));

    try {
      const result = await window.quiverApi.saveSettings({ language });
      if (!result.success) {
        showErrorDialog(
          t("settings.saveFailed"),
          result.errorMessage ?? t("settings.unknownError"),
          undefined
        );
        return;
      }

      await i18n.changeLanguage(language);
    } catch (error) {
      showUnexpectedError(error, "renderer:save-settings");
    } finally {
      stopLoading();
      setIsSaving(false);
    }
  };

  return (
    <section className="flex h-full flex-col" aria-labelledby="settings-page-title">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-[#f3fbfc] px-8">
        <div aria-hidden="true" className="h-6 w-6" />
        <Button
          className="h-9 rounded bg-[#006875] px-6 text-[12px] font-semibold text-white hover:bg-[#004f58]"
          disabled={isSaving}
          onClick={() => {
            void handleSave();
          }}
          size="sm"
          type="button"
        >
          {isSaving ? t("settings.saving") : t("settings.save")}
        </Button>
      </header>

      <div className="flex-grow overflow-y-auto p-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-[#151d1e]" id="settings-page-title">
              {t("settings.title")}
            </h2>
            <p className="mt-1 text-sm text-[#3b494c]">{t("settings.description")}</p>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <h2 className="mb-6 border-b border-[#E2E8F0] pb-4 text-lg font-semibold text-[#151d1e]">
              {t("settings.general")}
            </h2>

            <div>
              <label
                className="mb-2 block text-xs font-semibold text-[#3b494c]"
                htmlFor="language-select"
              >
                {t("settings.language")}
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
                  <option value="en">{t("settings.english")}</option>
                  <option value="ja">{t("settings.japanese")}</option>
                  <option value="zh-CN">{t("settings.simplifiedChinese")}</option>
                </select>
              </div>
              <p className="mt-2 text-sm text-[#3b494c]">{t("settings.languageDescription")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
