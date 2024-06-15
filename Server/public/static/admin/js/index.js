import { changePasswordShow } from "./changePassword.js";
import { DEFAULT_GROUP_ID, EVENTS, SERVER_ENDPOINTS } from "./constants.js";
import { mainHeaderStatus_e } from "./elements.js";
import { initExplorer, selectFileInUI } from "./explorer.js";
import {
    fetchCurrentLanguage,
    formatString,
    getLanguageData,
    initLanguage,
} from "./lang.js";
import { initMain, loadGroup } from "./main.js";
import { generateSidebar, initSidebar, selectSidebarGroup } from "./sidebar.js";

window.currentGroup = DEFAULT_GROUP_ID;
window.meta = {};

window.addEventListener(EVENTS.groupSelect, (e) => {
    window.currentGroup = e.detail.uuid;
    loadGroup(window.currentGroup);
});

window.addEventListener(EVENTS.reload, () => {
    load();
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

    initMain();
    initSidebar();
    initExplorer();
    //setTimeout(()=>  selectFileInUI((path)=>{console.log(path)}),100);
    await load();
}

window.load = load;
init();
