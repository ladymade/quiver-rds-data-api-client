import { Code2, Info, Link2, MemoryStick } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUnexpectedErrorHandler } from "../hooks/useUnexpectedErrorHandler";

type InfoPageProps = Readonly<Record<string, never>>;

const GITHUB_URL = "https://github.com/ladymade/quiver-rds-data-api-client";

export function InfoPage(_props: InfoPageProps): React.JSX.Element {
  const { t } = useTranslation();
  const [version, setVersion] = useState("");
  const { showUnexpectedError } = useUnexpectedErrorHandler();

  useEffect(() => {
    if (!window.quiverApi) {
      setVersion(t("info.versionUnavailable"));
      return;
    }

    void window.quiverApi
      .getAppVersion()
      .then(setVersion)
      .catch((error) => {
        setVersion(t("info.versionUnavailable"));
        showUnexpectedError(error, "renderer:get-app-version");
      });
  }, [showUnexpectedError, t]);

  return (
    <section className="mx-auto w-full max-w-5xl px-8 py-8" aria-labelledby="info-page-title">
      <header className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#006875]/10">
          <Info aria-hidden="true" className="text-[#006875]" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold leading-8 text-[#151d1e]" id="info-page-title">
            {t("info.title")}
          </h1>
          <p className="text-sm leading-5 text-[#3b494c]">{t("info.subtitle")}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <section className="relative overflow-hidden rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm md:col-span-12">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#006875]">
            {t("info.mission")}
          </h2>
          <p className="max-w-3xl text-base leading-6 text-[#151d1e]">{t("info.missionText")}</p>
        </section>

        <section className="rounded-xl border border-[#E2E8F0] bg-white px-6 py-3 shadow-sm md:col-span-8">
          <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#3b494c]">
            <MemoryStick aria-hidden="true" size={16} />
            {t("info.systemInformation")}
          </h2>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm leading-5 text-[#3b494c]">{t("info.version")}</span>
            <span
              className="font-mono text-[13px] leading-5 text-[#151d1e]"
              data-testid="app-version"
            >
              {version || t("info.loadingVersion")}
            </span>
          </div>
        </section>

        <section className="flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm md:col-span-4">
          <div>
            <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#3b494c]">
              <Link2 aria-hidden="true" size={16} />
              {t("info.resources")}
            </h2>
            <p className="mb-4 text-sm leading-5 text-[#3b494c]">
              {t("info.resourcesDescription")}
            </p>
          </div>
          <a
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#006875]/30 bg-[#F8FAFC] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#006875] transition-colors hover:border-[#006875] hover:bg-[#006875]/5"
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
          >
            <Code2 aria-hidden="true" size={20} />
            {t("info.viewOnGitHub")}
          </a>
        </section>
      </div>
    </section>
  );
}
