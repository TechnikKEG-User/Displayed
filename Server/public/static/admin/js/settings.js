import { initChangePassword } from "./changePassword.js";
import { EVENTS, SERVER_ENDPOINTS } from "./constants.js";
import {
    changeLanguageSelect_e,
    changeLanguageSubmit_e,
    changeLanguageTitle_e,
    settingsClose_icon,
    settingsOverlay_e,
    settingsRightContent_e,
    settingsTitle_e,
} from "./elements.js";
import {
    formatString,
    getCurrentLanguageCode,
    getLanguageData,
    getSupportedLanguages,
    setCurrentLanguageCode,
} from "./lang.js";

let groupChanged = false;

function initLanguageSettings() {
    const languages = getSupportedLanguages();

    changeLanguageSelect_e.innerHTML = "";

    languages.forEach((lang) => {
        const option = document.createElement("option");
        option.value = lang.code;
        option.innerText = `${lang.name} [${lang.code}]`;
        changeLanguageSelect_e.insertAdjacentElement("beforeend", option);

        if (lang.code === getCurrentLanguageCode()) {
            option.selected = true;
        }
    });
}

export function initSettings() {
    const lang = getLanguageData();
    initLanguageSettings();

    /* --------------------------------- Generic -------------------------------- */
    settingsTitle_e.innerText = formatString(lang.settings.title, {});
    settingsClose_icon.onclick = () => {
        if (groupChanged) {
            window.dispatchEvent(new Event(EVENTS.reload));
        }
        settingsOverlay_e.classList.remove("shown");
    };

    /* -------------------------------- Language -------------------------------- */
    changeLanguageTitle_e.innerText = formatString(
        lang.settings.language_title,
        {}
    );
    changeLanguageSubmit_e.innerText = formatString(
        lang.settings.language_save,
        {}
    );
    changeLanguageSubmit_e.onclick = () => {
        setCurrentLanguageCode(changeLanguageSelect_e.value);
    };

    initChangePassword();
}

function generateDevice(devName, devRef, previewSrc) {
    const lang = getLanguageData();
    const devMeta = window.meta.refs[devRef];

    const wrapper = document.createElement("div");
    wrapper.classList.add("settings-device");

    const content = document.createElement("div");
    content.classList.add("settings-device-content");

    const preview = document.createElement("iframe");
    preview.classList.add("settings-device-preview");
    preview.src = decodeURIComponent(previewSrc);

    const info = document.createElement("div");
    info.classList.add("settings-device-info");

    const nameRow = document.createElement("div");
    nameRow.classList.add("settings-device-name-row");

    const name = document.createElement("div");
    name.classList.add("settings-device-name");
    name.innerText = devName;

    const nameChangeIcon = document.createElement("div");
    nameChangeIcon.classList.add("settings-device-name-change-icon", "icon");
    nameChangeIcon.innerText = "edit";
    nameChangeIcon.onclick = () => {
        const newName = prompt(formatString(lang.settings.set_device_name, {}));

        if (newName == null || newName == "") {
            return;
        }

        devMeta.name = newName;
        fetch(
            SERVER_ENDPOINTS.setName + "?ref=" + devRef + "&name=" + newName,
            {
                method: "PATCH",
            }
        )
            .then(() => {
                name.innerText = newName;
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const deviceDeleteIcon = document.createElement("div");
    deviceDeleteIcon.classList.add("settings-device-delete-icon", "icon");
    deviceDeleteIcon.innerText = "delete";
    deviceDeleteIcon.onclick = () => {
        if (
            !confirm(
                formatString(lang.settings.ask_delete_device, {
                    name: devName,
                    ref: devRef,
                })
            )
        )
            return;

        fetch(SERVER_ENDPOINTS.deleteRef + "?ref=" + devRef, {
            method: "DELETE",
        })
            .then(() => {
                console.info(
                    `SETTINGS:deleteDevice: device '${devName}' (${devRef}) was deleted.`
                );
                window.dispatchEvent(new Event(EVENTS.reload));
            })
            .catch((err) => {
                console.error(err);
            });
    };

    nameRow.appendChild(name);
    nameRow.appendChild(nameChangeIcon);
    nameRow.appendChild(deviceDeleteIcon);

    const ref = document.createElement("div");
    ref.classList.add("settings-device-ref");
    ref.innerText = devRef;

    const sortingWrapper = document.createElement("div");
    sortingWrapper.classList.add("settings-device-sorting");

    const sortingSelect = document.createElement("select");
    sortingSelect.classList.add("settings-device-group-select");
    for (const [uuid, group] of Object.entries(window.meta.groups)) {
        const option = document.createElement("option");
        option.value = uuid;
        option.innerText = group.name;
        if (uuid === devMeta.group) {
            option.selected = true;
        }
        sortingSelect.insertAdjacentElement("beforeend", option);
    }

    const sortingSave = document.createElement("div");
    sortingSave.classList.add("settings-device-sorting-save", "icon");
    sortingSave.innerText = "save";
    sortingSave.onclick = () => {
        const newGroup = sortingSelect.value;
        devMeta.group = newGroup;
        fetch(
            SERVER_ENDPOINTS.setGroup + "?ref=" + devRef + "&group=" + newGroup,
            {
                method: "PATCH",
            }
        )
            .then(() => {
                console.info(
                    `SETTINGS:groupChange: device '${devName}' (${devRef}) was moved to group '${window.meta.groups[newGroup].name}' (${newGroup}).`
                );
                groupChanged = true;
            })
            .catch((err) => {
                console.error(err);
            });
    };

    sortingWrapper.appendChild(sortingSelect);
    sortingWrapper.appendChild(sortingSave);

    info.appendChild(nameRow);
    info.appendChild(ref);
    info.appendChild(sortingWrapper);

    content.appendChild(preview);
    content.appendChild(info);

    wrapper.appendChild(content);

    return wrapper;
}

export function generateDeviceTree() {
    settingsRightContent_e.innerHTML = "";

    for (const [ref, dev] of Object.entries(window.meta.refs)) {
        const { name, preview } = dev;
        settingsRightContent_e.insertAdjacentElement(
            "beforeend",
            generateDevice(name, ref, preview)
        );
    }
}
