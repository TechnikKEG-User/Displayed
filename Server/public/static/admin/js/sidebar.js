import {
    DEFAULT_GROUP_ID,
    JUST_WORK_GROUP_ID,
    EVENTS,
    SERVER_ENDPOINTS,
} from "./constants.js";
import {
    addGroup_icon,
    logout_icon,
    settings_icon,
    sidebarContent_e,
} from "./elements.js";
import { formatString, getLanguageData } from "./lang.js";

export function generateSidebarGroup(name, uuid, devCount) {
    const lang = getLanguageData();

    const wrapper = document.createElement("div");
    wrapper.classList.add("sidebar-group");
    wrapper.dataset.uuid = uuid;

    const content = document.createElement("div");
    content.classList.add("sidebar-group-content");

    const title = document.createElement("div");
    title.classList.add("sidebar-group-title");
    title.innerText =
        uuid == DEFAULT_GROUP_ID
            ? lang.group.default
            : uuid == JUST_WORK_GROUP_ID
            ? lang.group.justwork
            : name;

    const info = document.createElement("div");
    info.classList.add("sidebar-group-info");
    info.innerText = formatString(lang.sidebar.info, {
        num: devCount,
    });

    content.appendChild(title);
    content.appendChild(info);

    wrapper.appendChild(content);

    wrapper.onclick = () => {
        console.info(
            `SIDEBAR:groupSelect: group '${name}' (${uuid}) was selected.`
        );
        selectSidebarGroup(uuid);
        window.dispatchEvent(
            new CustomEvent(EVENTS.groupSelect, { detail: { uuid } })
        );
    };

    return wrapper;
}

export function selectSidebarGroup(uuid) {
    const sidebarGroups = document.querySelectorAll(".sidebar-group");
    sidebarGroups.forEach((group) => {
        group.classList.remove("sidebar-group-selected");
        if (group.dataset.uuid === uuid) {
            group.classList.add("sidebar-group-selected");
        }
    });
}

export function generateSidebar(meta) {
    sidebarContent_e.innerHTML = "";
    const groups = [];
    for (const [uuid, group] of Object.entries(meta.groups)) {
        const { name } = group;
        groups.push({
            uuid,
            name,
            devCount: 0,
        });
    }

    for (const [_, device] of Object.entries(meta.refs)) {
        const { group } = device;
        const groupIndex = groups.findIndex((g) => g.uuid === group);
        groups[groupIndex].devCount++;
    }

    for (const { name, uuid, devCount } of groups) {
        const group = generateSidebarGroup(name, uuid, devCount);
        sidebarContent_e.insertAdjacentElement("beforeend", group);
    }
}

export function initSidebar() {
    const lang = getLanguageData();

    addGroup_icon.onclick = () => {
        const name = prompt(formatString(lang.group.create_name_prompt, {}));
        if (name === null || name === "") {
            return;
        }

        fetch(
            SERVER_ENDPOINTS.createGroup + `?name=${encodeURIComponent(name)}`,
            {
                method: "POST",
            }
        )
            .then((resp) => resp.json())
            .then((data) => {
                const status = data.status;
                if (status !== "ok") {
                    console.error(data);
                    alert(
                        formatString(lang.group.error_creating, {
                            error: data.message,
                        })
                    );
                    return;
                }

                window.currentGroup = DEFAULT_GROUP_ID;
                window.dispatchEvent(new CustomEvent(EVENTS.reload));

                alert(formatString(lang.group.successfully_created, { name }));
            });
    };

    logout_icon.onclick = () => {
        window.location.href = "/logout";
    };

    settings_icon.onclick = () => {
        alert("TODO: Settings overlay");
    };
}
