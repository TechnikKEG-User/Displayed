import { getImagePage, isImage } from "./image.js";

/** @type {HTMLIFrameElement} */
const overlay_e = document.getElementById("overlay");
/** @type {HTMLIFrameElement} */
const bottom_e = document.getElementById("bottom");

const ref = new URLSearchParams(window.location.search).get("ref");
const defaultUrls = [
    {
        duration: 10,
        url: "https://cdn.jsdelivr.net/gh/deltazero-cz/kiosk.pi@master/stage2-kiosk/00-kiosk/files/splash.png",
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
    return fetch(
        "/api/view/currUrl?url=" + encodeURIComponent(url) + "&ref=" + ref,
        {
            method: "PUT",
        }
    );
}

async function interval() {
    if (Date.now() > nextMetaRefetch) {
        try {
            const res = await fetch("/api/view/pages/" + ref + ".json");
            const data = await res.json();

            urls = data.urls || defaultUrls;
            if (urls.length === 0) {
                urls = defaultUrls;
            }
            if (currentUrlIndex >= urls.length) {
                currentUrlIndex = 0;
            }

            nextMetaRefetch = (data.reload || 10) * 1000 + Date.now();
        } catch (e) {
            console.error(e);
            nextMetaRefetch = Date.now() + 10000;
        }
    }

    if (Date.now() > nextSlideSwitch) {
        currentUrlIndex = (currentUrlIndex + 1) % urls.length;
        const url = urls[currentUrlIndex].url;
        if (isImage(url)) {
            const res = await fetch(url);

            const contentB64 = btoa(
                String.fromCharCode.apply(
                    null,
                    new Uint8Array(await res.arrayBuffer())
                )
            );

            showUrl(getImagePage(contentB64, url.split(".").pop()));
        } else {
            showUrl(url);
        }

        nextSlideSwitch = urls[currentUrlIndex].duration * 1000 + Date.now();
    }
}

setInterval(interval, 1000);
interval();
