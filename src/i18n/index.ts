import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en";
import om from "./locales/om";
import am from "./locales/am";

export const LANGS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "om", label: "Afaan Oromoo", flag: "🇪🇹" },
  { code: "am", label: "አማርኛ", flag: "🇪🇹" },
] as const;

export type LangCode = (typeof LANGS)[number]["code"];

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        om: { translation: om },
        am: { translation: am },
      },
      fallbackLng: "en",
      supportedLngs: ["en", "om", "am"],
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
        lookupLocalStorage: "fb_lang",
      },
    });
}

export default i18n;

export function langName(code: string) {
  return LANGS.find((l) => l.code === code)?.label ?? "English";
}
