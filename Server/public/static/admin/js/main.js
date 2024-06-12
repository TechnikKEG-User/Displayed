import { DEFAULT_GROUP_ID } from "./constants.js";
import { mainHeaderStatus_e, mainHeaderTitle_e } from "./elements.js";
import { getLanguageData } from "./lang.js";

export function loadGroup(uuid) {
    const group = window.meta.groups[uuid];
    const lang = getLanguageData();

    mainHeaderTitle_e.innerText =
        uuid == DEFAULT_GROUP_ID ? lang.group.default : group.name;
    mainHeaderStatus_e.style.display = group.readonly ? "" : "none";
}
