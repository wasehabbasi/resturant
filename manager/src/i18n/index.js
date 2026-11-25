import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import ur from "./locales/ur.json";

const savedLanguage = localStorage.getItem("appLanguage") || "en";

const updateDocumentDirection = (language) => {
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ur: { translation: ur },
  },
  lng: savedLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

updateDocumentDirection(savedLanguage);

i18n.on("languageChanged", updateDocumentDirection);

export default i18n;