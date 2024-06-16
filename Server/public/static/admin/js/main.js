import {
    DEFAULT_GROUP_ID,
    EVENTS,
    JUST_WORK_GROUP_ID,
    SERVER_ENDPOINTS,
} from "./constants.js";
import {
    addSlide_icon,
    deleteGroup_icon,
    mainHeaderStatus_e,
    mainHeaderTitle_e,
    mainReadOnly_e,
    mainSlides_e,
    renameGroup_icon,
} from "./elements.js";
import { selectDirInUI, selectFileInUI } from "./explorer.js";
import { formatString, getLanguageData } from "./lang.js";

export function loadGroup(uuid) {
    const group = window.meta.groups[uuid];
    const lang = getLanguageData();
    Array.from(mainSlides_e.children).forEach((child) => {
        if (child.classList.contains("main-slide")) {
            child.remove();
        }
    });
    if (uuid == JUST_WORK_GROUP_ID) {
        mainHeaderTitle_e.innerText = lang.group.justwork;
        mainHeaderStatus_e.style.display = "none";
        mainReadOnly_e.style.display = "none";
        generateJustWorkSlides(window.meta);
        return;
    }
    mainHeaderTitle_e.innerText =
        uuid == DEFAULT_GROUP_ID ? lang.group.default : group.name;
    mainHeaderStatus_e.style.display = group.readonly ? "" : "none";
    mainReadOnly_e.style.display = group.readonly ? "" : "none";

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

    const settings = document.createElement("div");
    settings.classList.add("main-slide-settings");

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
        selectFileInUI((path) => {
            cloudPath.innerText = path;
            slide.url = path;

            saveGroup().catch((err) => {
                console.error(err);
            });
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

    settings.appendChild(typeSelectorWrapper);
    settings.appendChild(cloudWrapper);
    settings.appendChild(remoteWrapper);
    settings.appendChild(timingWrapper);

    const sortWrapper = document.createElement("div");
    sortWrapper.classList.add("main-slide-sort");

    const sortUpIcon = document.createElement("div");
    sortUpIcon.classList.add("icon", "main-slide-sort-up");
    sortUpIcon.innerText = "arrow_upward";
    if (index === 0)
        sortUpIcon.classList.add("main-slide-sort-direction-disallowed");
    sortUpIcon.onclick = () => {
        if (index === 0) return;

        // Swap slides
        const tmp = group.urls[index];
        group.urls[index] = group.urls[index - 1];
        group.urls[index - 1] = tmp;

        // Save and reload
        saveGroup()
            .then(() => {
                window.dispatchEvent(new CustomEvent(EVENTS.reload));
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const sortDownIcon = document.createElement("div");
    sortDownIcon.classList.add("icon", "main-slide-sort-down");
    sortDownIcon.innerText = "arrow_downward";
    if (index === group.urls.length - 1)
        sortDownIcon.classList.add("main-slide-sort-direction-disallowed");
    sortDownIcon.onclick = () => {
        if (index === group.urls.length - 1) return;

        // Swap slides
        const tmp = group.urls[index];
        group.urls[index] = group.urls[index + 1];
        group.urls[index + 1] = tmp;

        // Save and reload
        saveGroup()
            .then(() => {
                window.dispatchEvent(new CustomEvent(EVENTS.reload));
            })
            .catch((err) => {
                console.error(err);
            });
    };

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
            // Remove slide from array
            group.urls.splice(index, 1);

            saveGroup()
                .then(() => {
                    // Reload slides
                    window.dispatchEvent(new CustomEvent(EVENTS.reload));
                })
                .catch((err) => {
                    console.error(err);
                });
        }
    };

    sortWrapper.appendChild(sortUpIcon);
    sortWrapper.appendChild(deleteIcon);
    sortWrapper.appendChild(sortDownIcon);

    content.appendChild(settings);
    content.appendChild(sortWrapper);

    wrapper.appendChild(content);

    return wrapper;
}

export function generateJustWorkSlideDurationEntry(slide) {
    const lang = getLanguageData();
    const duration = slide.duration;

    const wrapperWrapper = document.createElement("div");
    wrapperWrapper.classList.add("main-slide-content");

    const wrapper = document.createElement("div");
    wrapper.classList.add("main-slide-settings");

    const typeSelectorWrapper = document.createElement("div");
    typeSelectorWrapper.classList.add("main-slide-type-selector");

    const durationLabel = document.createElement("div");
    durationLabel.classList.add("main-slide-type-selector-info");
    durationLabel.innerText = lang.justwork.duration;
    typeSelectorWrapper.appendChild(durationLabel);

    const timingWrapper = document.createElement("div");
    timingWrapper.classList.add("main-slide-type-cloud");
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

    timingWrapper.appendChild(timingInput);
    timingWrapper.appendChild(timingSave);
    wrapper.appendChild(typeSelectorWrapper);
    wrapper.appendChild(timingWrapper);

    wrapperWrapper.appendChild(wrapper);

    const mainWrapper = document.createElement("div");
    mainWrapper.classList.add("main-slide");
    mainWrapper.dataset.type = "cloud";
    mainWrapper.appendChild(wrapperWrapper);

    return mainWrapper;
}
export function createJustWorkSlideFolderEntry(slide) {
    const lang = getLanguageData();

    const wrapperWrapper = document.createElement("div");
    wrapperWrapper.classList.add("main-slide-content");

    const wrapper = document.createElement("div");
    wrapper.classList.add("main-slide-settings");

    const typeSelectorWrapper = document.createElement("div");
    typeSelectorWrapper.classList.add("main-slide-type-selector");

    const Label = document.createElement("div");
    Label.innerText = lang.justwork.folder;
    typeSelectorWrapper.appendChild(Label);

    const timingWrapper = document.createElement("div");
    timingWrapper.classList.add("main-slide-type-cloud");

    const cloudPath = document.createElement("div");
    cloudPath.classList.add("main-slide-type-cloud-path");

    cloudPath.innerText = slide.duration;
    const cloudPath_icon = document.createElement("div");
    cloudPath_icon.classList.add("icon", "main-slide-type-cloud-picker");
    cloudPath_icon.innerText = "folder";
    cloudPath_icon.onclick = () => {
        selectDirInUI((path) => {
            cloudPath.innerText = path;
            slide.duration = path;

            saveGroup().catch((err) => {
                console.error(err);
            });
        });
    };

    timingWrapper.appendChild(cloudPath);
    timingWrapper.appendChild(cloudPath_icon);
    wrapper.appendChild(typeSelectorWrapper);
    wrapper.appendChild(timingWrapper);

    wrapperWrapper.appendChild(wrapper);

    const mainWrapper = document.createElement("div");
    mainWrapper.classList.add("main-slide");
    mainWrapper.dataset.type = "cloud";
    mainWrapper.appendChild(wrapperWrapper);
    return mainWrapper;
}
export function generateJustWorkSlides(meta) {
    const group = meta.groups[JUST_WORK_GROUP_ID];
    group.urls.forEach((slide, index) => {
        if (slide.url == "generalDuration")
            mainSlides_e.insertAdjacentElement(
                "beforeend",
                generateJustWorkSlideDurationEntry(slide)
            );
        if (slide.url == "folder")
            mainSlides_e.insertAdjacentElement(
                "beforeend",
                createJustWorkSlideFolderEntry(slide)
            );
    });
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
    const lang = getLanguageData();

    addSlide_icon.onclick = () => {
        const group = window.meta.groups[window.currentGroup];

        if (group.readonly) return;

        group.urls.push({
            type: "cloud",
            url: "",
        });

        saveGroup()
            .then(() => {
                console.info("MAIN:addSlide: added new slide to group.");
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

    deleteGroup_icon.onclick = () => {
        const group = window.meta.groups[window.currentGroup];

        if (group.readonly) return;

        if (
            confirm(
                formatString(lang.main.ask_delete_group, { name: group.name })
            )
        ) {
            fetch(
                SERVER_ENDPOINTS.deleteGroup + "?group=" + window.currentGroup,
                {
                    method: "DELETE",
                }
            )
                .then(() => {
                    console.info("MAIN:deleteGroup: deleted group.");

                    window.currentGroup = DEFAULT_GROUP_ID;
                    window.dispatchEvent(new CustomEvent(EVENTS.reload));
                })
                .catch((err) => {
                    console.error(err);
                });
        }
    };

    renameGroup_icon.onclick = () => {
        const newName = prompt(formatString(lang.main.rename_group_prompt, {}));

        if (newName === null || newName === "") {
            return;
        }

        fetch(
            SERVER_ENDPOINTS.setGroupName +
                `?group=${window.currentGroup}&name=${encodeURIComponent(
                    newName
                )}`,
            {
                method: "PATCH",
            }
        )
            .then(() => {
                window.dispatchEvent(new CustomEvent(EVENTS.reload));
            })
            .catch((err) => {
                console.error(err);
            });
    };
}
