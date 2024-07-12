import { getImagePage, isImage } from "./image.js";

/** @type {HTMLIFrameElement} */
const overlay_e = document.getElementById("overlay");
/** @type {HTMLIFrameElement} */
const bottom_e = document.getElementById("bottom");

const ref = new URLSearchParams(window.location.search).get("ref");
const defaultUrls = [
    {
        duration: 10,
        url: "/imagen/banner.png",
    },
];

overlay_e.style.opacity = 0;
let isTopIframeShown = false;

let nextMetaRefetch = 0;
let nextSlideSwitch = 0;

let currentUrlIndex = 0;
let urls = defaultUrls;

function showUrl(url) {
    if (isTopIframeShown) {
        bottom_e.src = url;
        bottom_e.onload = () => {
            overlay_e.style.opacity = 0;
        };
    } else {
        overlay_e.src = url;
        overlay_e.onload = () => {
            overlay_e.style.opacity = 1;
        };
    }

    isTopIframeShown = !isTopIframeShown;
    return fetch("/api/view/currUrl", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            ref: ref,
            url: encodeURIComponent(url),
        }),
    });
}

function isLinkText(url) {
    if (url.endsWith(".link.txt")) {
        return true;
    }
    if (url.endsWith(".linktxt")) {
        return true;
    }
    if (url.endsWith(".link")) {
        return true;
    }
    return false;
}

async function interval() {
    if (Date.now() > nextMetaRefetch) {
        try {
            const res = await fetch(
                "/api/view/pages/" +
                    ref +
                    ".json?t=" +
                    Math.round(Date.now() / 1000)
            );
            const data = await res.json();

            urls = data.urls || defaultUrls;
            if (urls.length === 0) {
                urls = defaultUrls;
                console.warn("No urls found, using default");
            }
            if (currentUrlIndex >= urls.length) {
                currentUrlIndex = 0;
            }

            nextMetaRefetch = (data.reload || 10) * 1000 + Date.now();
        } catch (e) {
            console.error("Couldn't fetch meta:", e);
            nextMetaRefetch = Date.now() + 10000;
        }
    }

    if (Date.now() > nextSlideSwitch) {
        currentUrlIndex = (currentUrlIndex + 1) % urls.length;
        let url = urls[currentUrlIndex].url;
        if (isImage(url)) {
            await fetch(url);

            if (!url.startsWith("http")) {
                url = window.location.origin + url;
            }
            showUrl(getImagePage(url));
        } else if (isLinkText(url)) {
            const res = await fetch(url);
            const text = await res.text();
            showUrl(text);
        } else {
            showUrl(url);
        }

        nextSlideSwitch = urls[currentUrlIndex].duration * 1000 + Date.now();
    }
}

setInterval(interval, 1000);
interval();
