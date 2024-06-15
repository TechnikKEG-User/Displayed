import { EVENTS, LOCAL_STORAGE_LANG_FIELD } from "./constants.js";

let languageMeta = [];
let languageData = {};

// Function to replace placeholders, supporting escaping with \{ and \}
export function formatString(template, replacements) {
    return template.replace(/\\?\{(.*?)\}/g, (match, key) => {
        // If the match starts with \{, it's escaped, so remove the backslash and keep the braces
        if (match.startsWith("\\")) {
            return `{${key}}`;
        }
        // Otherwise, replace the placeholder with the actual value from the replacements object
        return replacements[key] == undefined ? "" : replacements[key];
    });
}

export function getSupportedLanguages() {
    return languageMeta;
}

export function setCurrentLanguageCode(lang) {
    window.localStorage.setItem(LOCAL_STORAGE_LANG_FIELD, lang);
    window.location.reload();
}

export function getCurrentLanguageCode() {
    const browserLang = navigator.language || navigator.userLanguage;
    return (
        window.localStorage.getItem(LOCAL_STORAGE_LANG_FIELD) ||
        (getSupportedLanguages()
            .map((lang) => lang.code)
            .includes(browserLang)
            ? browserLang
            : "en-US")
    );
}

export async function fetchCurrentLanguage() {
    try {
        const response = await fetch(
            `static/admin/lang/${getCurrentLanguageCode()}.json`
        );
        languageData = await response.json();
    } catch (err) {
        console.error(err);
        return;
    }
}

export function getLanguageData() {
    return languageData;
}

export async function initLanguage() {
    try {
        const response = await fetch("static/admin/lang/_meta.json");
        languageMeta = await response.json();
    } catch (err) {
        console.error(err);
        return;
    }
}
