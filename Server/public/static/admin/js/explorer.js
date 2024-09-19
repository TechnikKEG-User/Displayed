import { explorerPath_e, explorer_e, explorerFiles_e, explorerHeader_e } from "./elements.js";
import { getLanguageData } from "./lang.js";

class Explorer {
    constructor() {
        this.init = false;
        this.initAsync();
        this.cdCb = null;
        this.currentPath = "/";
    }
    async initAsync() {
        const res = await fetch("/api/admin/ls", {
            method: "GET"
        });
        const data = await res.json();
        this.fs = this.#explore(data);
        this.init = true;
    }

    #explore(data) {
        let fs = {};
        for (let i = 0; i < data.length; i++) {
            let path = data[i].path;
            let parts = path.split("/");
            let current = fs;
            let part = null;
            for (let j = 0; j < parts.length; j++) {
                part = parts[j];
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }
            current["//isDir"] = data[i].isDir;
        }
        return fs;
    }
    setCb(cb) {
        this.cdCb = cb;
    }
    absPathSp(path) {
        let pathPs = path.split("/");
        let currentPs = this.currentPath.split("/");
        let newPath = [];
        if (pathPs[0] === "") {
            newPath = pathPs;
        }
        if (pathPs[0] === ".") {
            newPath = currentPs.concat(pathPs.slice(1));
        }
        let rtPath = [];
        for (let i = 0; i < pathPs.length; i++) {
            if (pathPs[i] === "..") {
                rtPath.pop();
            } else if (pathPs[i] === ".") {
                continue;
            } else {
                rtPath.push(pathPs[i]);
            }
        }
        if (rtPath[rtPath.length - 1] === "") rtPath.pop();
        return rtPath;
    }
    absPath(path) {
        return this.absPathSp(path).join("/");
    }
    cd(path) {
        let parts = this.absPathSp(path);
        let current = this.fs;
        let part = null;
        for (let j = 0; j < parts.length; j++) {
            part = parts[j];
            if (!current[part]) {
                return false;
            }
            current = current[part];
        }
        this.currentPath = parts.join("/");

        if (this.cdCb) {
            this.cdCb();
        }
        return true;
    }
    ls() {
        let current = this.fs;
        let parts = this.currentPath.split("/");
        let part = null;
        for (let j = 0; j < parts.length; j++) {
            part = parts[j];
            current = current[part];
        }
        return Object.keys(current);
    }
    isFile(path = undefined) {
        if (path === undefined) {
            path = this.currentPath;
        }
        let parts = this.absPathSp(path);
        let current = this.fs;
        let part = null;
        for (let j = 0; j < parts.length; j++) {
            part = parts[j];
            if (!current[part]) {
                console.error("Path does not exist", part);
                return false;
            }
            current = current[part];
        }
        if (current["//isDir"] === undefined) {
            return Object.keys(current).length === 0;
        }
        return !current["//isDir"];
    }
    isDir(path = undefined) {
        return !this.isFile(path);
    }
}
let callback = null;
let fileSelectButton = null;
let dirSelectButton = null;
let explorer = null;
function closeExplorer() {
    explorer_e.style.display = "none";
}
export function initExplorer() {
    const lang = getLanguageData();
    explorer = new Explorer();
    let backButton = document.createElement("button");
    backButton.classList.add("icon");
    backButton.classList.add("explorer-button");
    backButton.innerText = "arrow_back";
    backButton.onclick = (e) => {
        let parts = explorer.currentPath.split("/");
        parts.pop();
        explorer.cd(parts.join("/"));
        render();
    }
    let returnButton = document.createElement("button");
    returnButton.classList.add("icon");
    returnButton.classList.add("explorer-button");
    returnButton.innerText = "keyboard_return";
    returnButton.onclick = (e) => {
        explorer.cd(explorerPath_e.value);
        render();
    }

    let selectFileButton = document.createElement("button");
    selectFileButton.classList.add("explorer-button");
    selectFileButton.classList.add("explorer-float-right");
    selectFileButton.innerText = lang.explorer.select_file;
    fileSelectButton = selectFileButton;
    selectFileButton.onclick = (e) => {
        if (markedDiv) {
            let name = markedDiv.children[1].innerText;
            if (explorer.isFile(explorer.currentPath + "/" + name)) {
                callback(explorer.currentPath + "/" + name);
                closeExplorer();
            } else {
                alert(lang.explorer.select_file_error + " 0x987654");
            }
        } else {
            alert(lang.explorer.select_file_error + " 0x391238");
        }
    }

    let selectDirButton = document.createElement("button");
    selectDirButton.classList.add("explorer-button");
    selectDirButton.classList.add("explorer-float-right");
    selectDirButton.innerText = lang.explorer.select_dir;
    dirSelectButton = selectDirButton;
    selectDirButton.onclick = (e) => {
        if (markedDiv) {
            let name = markedDiv.children[1].innerText;
            if (explorer.isDir(explorer.currentPath + "/" + name)) {
                console.log("SELECTED_DIR", explorer.currentPath + "/" + name + "/");
                callback(explorer.currentPath + "/" + name + "/");
                closeExplorer();
            } else {
                alert(lang.explorer.select_dir_error + " 0x987654");
            }
        } else {
            alert(lang.explorer.select_dir_error + " 0x391238");
        }
    }


    let cancelButton = document.createElement("button");
    cancelButton.classList.add("explorer-button");
    cancelButton.classList.add("explorer-float-right");
    cancelButton.innerText = lang.explorer.cancel;
    cancelButton.onclick = (e) => {
        closeExplorer();
    }

    explorerHeader_e.appendChild(cancelButton);
    explorerHeader_e.appendChild(backButton);
    explorerHeader_e.appendChild(returnButton);
    explorerHeader_e.appendChild(selectFileButton);
    explorerHeader_e.appendChild(selectDirButton);
    window.explorer = explorer;
}

function render() {
    if (!explorer.init) {
        return;
    }
    Array.from(explorerFiles_e.children).forEach((child) => { child.remove() });
    explorer.cd(explorerPath_e.value);
    let files = explorer.ls();
    for (let i = 0; i < files.length; i++) {
        explorerFiles_e.appendChild(generateFile(files[i]));
    }

}
const ICONS = {
    FOLDER: "/static/admin/explorer/icons/Folder.png",
    IMAGE: "/static/admin/explorer/icons/Image.png",
    TEXT: "/static/admin/explorer/icons/Text.png",
    VIDEO: "/static/admin/explorer/icons/Video.png",
    LINK: "/static/admin/explorer/icons/Link.png",
    DOCUMENT: "/static/admin/explorer/icons/Document.png",
    DEFAULT: "/static/admin/explorer/icons/Default.png"
}
const FILE_REGISTRY = {
    ".png": ICONS.IMAGE,
    ".jpg": ICONS.IMAGE,
    ".jpeg": ICONS.IMAGE,
    ".gif": ICONS.IMAGE,
    ".bmp": ICONS.IMAGE,
    ".link": ICONS.LINK,
    ".link.txt": ICONS.LINK,
    ".linktxt": ICONS.LINK,
    ".txt": ICONS.TEXT,
    ".xml": ICONS.TEXT,
    ".yml": ICONS.TEXT,
    ".mp4": ICONS.VIDEO,
    ".avi": ICONS.VIDEO,
    ".mkv": ICONS.VIDEO,
    ".webm": ICONS.VIDEO,
    ".doc": ICONS.DOCUMENT,
    ".docx": ICONS.DOCUMENT,
    ".pdf": ICONS.DOCUMENT,
    ".ppt": ICONS.DOCUMENT,
    ".pptx": ICONS.DOCUMENT,
    ".xls": ICONS.DOCUMENT,
    ".xlsx": ICONS.DOCUMENT
}
function getIcon(name, isDir) {
    if (isDir) {
        return ICONS.FOLDER;
    }
    for (let key in FILE_REGISTRY) {
        if (name.endsWith(key)) {
            return FILE_REGISTRY[key];
        }
    }
    return ICONS.DEFAULT;
}
let markedDiv = null;
function markDiv(div) {
    if (markedDiv) {
        markedDiv.classList.remove("explorer-file-marked");
    }
    markedDiv = div;
    markedDiv.classList.add("explorer-file-marked");
}
function generateFile(name) {
    let isDir = explorer.isDir(explorer.currentPath + "/" + name);

    let div = document.createElement("div");
    div.classList.add("explorer-file");

    let img = document.createElement("img");
    img.src = getIcon(name, isDir);
    img.classList.add("explorer-file-img");
    div.appendChild(img);
    let title = document.createElement("div");
    title.classList.add("explorer-file-name");
    title.innerText = name;
    div.appendChild(title);
    div.onclick = (e) => {
        if (div.classList.contains("explorer-file-marked")) {
            div.classList.remove("explorer-file-marked");
            markedDiv = null;
            return;
        }
        markDiv(div);
    }
    div.ondblclick = (e) => {
        if (isDir) {
            explorer.cd(explorer.currentPath + "/" + name);
            render();
            return;
        }
        window.open(explorer.currentPath + "/" + name, "_blank");
    }
    return div;
}


function selectUI(fileSel, clb) {
    callback = clb;
    switch(fileSel){
        case 1:
            fileSelectButton.style.display = "block";
            dirSelectButton.style.display = "none";
            break;
        case 0:
            fileSelectButton.style.display = "none";
            dirSelectButton.style.display = "block";
            break;
        case -1:
            fileSelectButton.style.display = "block";
            dirSelectButton.style.display = "block";
            break;
    }
    explorer.setCb(() => {
        explorerPath_e.value = explorer.currentPath;
    })
    console.log("INIT_CD", explorer.cd("/mount/"));
    explorer_e.style.display = "block";
    render();

}
export function selectFileInUI(clb) {
    return selectUI(1, clb);
}
export function selectDirInUI(clb) {
    return selectUI(0, clb);
}
export function selectFileOrDirInUI(clb) {
    return selectUI(-1, clb);
}