import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import es from "./locales/es.json";

i18n.use(initReactI18next).init({
    // compatibilityJSON: "v3",
    lng: "es", // default language
    fallbackLng: "en",
    resources: {
        en: {
            translation: en,
        },
        es: {
            translation: es,
        },
    },
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
