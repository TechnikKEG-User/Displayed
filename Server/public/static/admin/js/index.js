import { DEFAULT_GROUP_ID, EVENTS, SERVER_ENDPOINTS } from "./constants.js";
import { mainHeaderStatus_e } from "./elements.js";
import {
    fetchCurrentLanguage,
    formatString,
    getLanguageData,
    initLanguage,
} from "./lang.js";
import { loadGroup } from "./main.js";
import { generateSidebar, initSidebar, selectSidebarGroup } from "./sidebar.js";

window.currentGroup = DEFAULT_GROUP_ID;
window.meta = {};

window.addEventListener(EVENTS.groupSelect, (e) => {
    window.currentGroup = e.detail.uuid;
    loadGroup(window.currentGroup);
});

async function load() {
    const lang = getLanguageData();

    mainHeaderStatus_e.innerText = formatString(lang.main.readonly, {});

    let data = {};
    try {
        const response = await fetch(SERVER_ENDPOINTS.data);
        data = await response.json();
    } catch (err) {
        console.error(err);
        return;
    }

    window.meta = data;

    generateSidebar(data);

    selectSidebarGroup(window.currentGroup);
    loadGroup(window.currentGroup);
}

async function init() {
    await initLanguage();
    await fetchCurrentLanguage();

    initSidebar();

    await load();
}

window.load = load;
init();
