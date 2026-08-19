import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import type { AppLanguage } from "../shared/types/ipc";
import en from "./locales/en.json";
import ja from "./locales/ja.json";
import zhCN from "./locales/zh-CN.json";

const resources = {
  en: { translation: en },
  ja: { translation: ja },
  "zh-CN": { translation: zhCN },
};

i18n.on("languageChanged", (language) => {
  document.documentElement.lang = language;
});

export async function initializeI18n(language: AppLanguage): Promise<void> {
  if (i18n.isInitialized) {
    await i18n.changeLanguage(language);
    return;
  }

  await i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;
