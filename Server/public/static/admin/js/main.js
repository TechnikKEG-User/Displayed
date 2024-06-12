import { DEFAULT_GROUP_ID, EVENTS, SERVER_ENDPOINTS } from "./constants.js";
import {
    addSlide_icon,
    mainHeaderStatus_e,
    mainHeaderTitle_e,
    mainSlides_e,
} from "./elements.js";
import { formatString, getLanguageData } from "./lang.js";

export function loadGroup(uuid) {
    const group = window.meta.groups[uuid];
    const lang = getLanguageData();

    mainHeaderTitle_e.innerText =
        uuid == DEFAULT_GROUP_ID ? lang.group.default : group.name;
    mainHeaderStatus_e.style.display = group.readonly ? "" : "none";

    generateSlides(window.meta);
}

const saveGroup = () => {
    return fetch(
        SERVER_ENDPOINTS.setGroupContent + "?group=" + window.currentGroup,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(window.meta.groups[window.currentGroup]),
        }
    );
};

export function generateSlideEntry(type, target, duration, index) {
    const lang = getLanguageData();

    const group = window.meta.groups[window.currentGroup];
    const slide = group.urls[index];

    const wrapper = document.createElement("div");
    wrapper.classList.add("main-slide");
    wrapper.dataset.type = type;

    const content = document.createElement("div");
    content.classList.add("main-slide-content");

    const deleteIcon = document.createElement("div");
    deleteIcon.classList.add("icon", "main-slide-delete");
    deleteIcon.innerText = "delete";
    deleteIcon.onclick = () => {
        if (
            confirm(
                formatString(lang.main.ask_delete, {
                    type: type == "cloud" ? lang.main.cloud : lang.main.remote,
                    target,
                })
            )
        ) {
            saveGroup()
                .then(() => {
                    // Remove slide from array
                    group.urls.splice(index, 1);

                    // Reload slides
                    window.dispatchEvent(new CustomEvent(EVENTS.reload));
                })
                .catch((err) => {
                    console.error(err);
                });
        }
    };

    const typeSelectorWrapper = document.createElement("div");
    typeSelectorWrapper.classList.add("main-slide-type-selector");

    const typeSelectorInfo = document.createElement("div");
    typeSelectorInfo.classList.add("main-slide-type-selector-info");
    typeSelectorInfo.innerText = formatString(lang.main.source, {});

    const typeSelectorCloud = document.createElement("div");
    typeSelectorCloud.classList.add("main-slide-type-selector-field");
    typeSelectorCloud.dataset.type = "cloud";
    typeSelectorCloud.innerText = lang.main.cloud;
    typeSelectorCloud.onclick = () => {
        wrapper.dataset.type = "cloud";
    };

    const typeSelectorRemote = document.createElement("div");
    typeSelectorRemote.classList.add("main-slide-type-selector-field");
    typeSelectorRemote.dataset.type = "remote";
    typeSelectorRemote.innerText = lang.main.remote;
    typeSelectorRemote.onclick = () => {
        wrapper.dataset.type = "remote";
    };

    typeSelectorWrapper.appendChild(typeSelectorInfo);
    typeSelectorWrapper.appendChild(typeSelectorCloud);
    typeSelectorWrapper.appendChild(typeSelectorRemote);

    const cloudWrapper = document.createElement("div");
    cloudWrapper.classList.add("main-slide-type-cloud");

    const cloudPath = document.createElement("div");
    cloudPath.classList.add("main-slide-type-cloud-path");

    const cloudPath_icon = document.createElement("div");
    cloudPath_icon.classList.add("icon", "main-slide-type-cloud-picker");
    cloudPath_icon.innerText = "folder";
    cloudPath_icon.onclick = () => {
        // TODO: File picker
        slide.url = "/path/to/file";

        saveGroup().catch((err) => {
            console.error(err);
        });
    };

    if (type === "cloud") {
        cloudPath.innerText = target;
        cloudWrapper.dataset.path = target;
    }

    cloudWrapper.appendChild(cloudPath);
    cloudWrapper.appendChild(cloudPath_icon);

    const remoteWrapper = document.createElement("div");
    remoteWrapper.classList.add("main-slide-type-remote");

    const remoteLabel = document.createElement("div");
    remoteLabel.classList.add("main-slide-type-remote-label");
    remoteLabel.innerText = formatString(lang.main.url, {});

    const remoteInput = document.createElement("input");
    remoteInput.classList.add("main-slide-type-remote-url");
    remoteInput.type = "text";

    const remoteSave = document.createElement("div");
    remoteSave.classList.add("icon", "main-slide-type-remote-save");
    remoteSave.innerText = "save";
    remoteSave.onclick = () => {
        const value = remoteInput.value;
        if (value.length == 0) {
            return;
        }

        slide.url = value;

        saveGroup().catch((err) => {
            console.error(err);
        });
    };

    if (type === "remote") {
        remoteInput.value = target;
    }

    remoteWrapper.appendChild(remoteLabel);
    remoteWrapper.appendChild(remoteInput);
    remoteWrapper.appendChild(remoteSave);

    const timingWrapper = document.createElement("div");
    timingWrapper.classList.add("main-slide-timing");

    const timingLabel = document.createElement("div");
    timingLabel.classList.add("main-slide-timing-label");
    timingLabel.innerText = formatString(lang.main.timing, {});

    const timingInput = document.createElement("input");
    timingInput.classList.add("main-slide-timing-input");
    timingInput.type = "number";
    timingInput.min = 5;
    timingInput.max = 60 * 60;
    timingInput.value = duration;

    const timingSave = document.createElement("div");
    timingSave.classList.add("icon", "main-slide-timing-save");
    timingSave.innerText = "save";
    timingSave.onclick = () => {
        const value = timingInput.value;
        if (value.length == 0) {
            return;
        }

        const parsedValue = parseInt(value);
        if (isNaN(parsedValue)) {
            return;
        }

        slide.duration = parsedValue;

        saveGroup().catch((err) => {
            console.error(err);
        });
    };

    timingWrapper.appendChild(timingLabel);
    timingWrapper.appendChild(timingInput);
    timingWrapper.appendChild(timingSave);

    content.appendChild(deleteIcon);
    content.appendChild(typeSelectorWrapper);
    content.appendChild(cloudWrapper);
    content.appendChild(remoteWrapper);
    content.appendChild(timingWrapper);

    wrapper.appendChild(content);

    return wrapper;
}

export function generateSlides(meta) {
    const group = meta.groups[window.currentGroup];
    group.urls.forEach((slide, index) => {
        mainSlides_e.insertAdjacentElement(
            "beforeend",
            generateSlideEntry(
                slide.url.startsWith("/") ? "cloud" : "remote",
                slide.url,
                slide.duration,
                index
            )
        );
    });
}

export function initMain() {
    addSlide_icon.onclick = () => {
        const group = window.meta.groups[window.currentGroup];
        group.urls.push({
            type: "cloud",
            url: "",
        });

        saveGroup()
            .then(() => {
                const index = group.urls.length - 1;
                mainSlides_e.insertAdjacentElement(
                    "beforeend",
                    generateSlideEntry("cloud", "", 15, index)
                );
            })
            .catch((err) => {
                console.error(err);
            });
    };
}
