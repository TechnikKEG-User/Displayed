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

let isTopIframeShown = false;

let nextMetaRefetch = 0;
let nextSlideSwitch = 0;

let currentUrlIndex = 0;

let inFrameBackgroundMode = 0;

let urls = defaultUrls;

/**
 * Show/hide the overlay iframe. This also updates the isTopIframeShown variable
 * @param {boolean} showOverlay Whether or not to show the overlay iframe
 */
function showIframe(showOverlay) {
    overlay_e.style.opacity = showOverlay ? 1 : 0;
    isTopIframeShown = showOverlay;
}

/**
 * Sets the url in a hidden iframe and as soon as it's loaded, shows it
 * @param {string} url The url to show in the currently hidden iframe
 * @param {boolean} waitInnerContentLoadEv Whether or not to wait for the innerContentLoadEv event to show the iframe (used for images and videos)
 */
function showUrl(url, waitInnerContentLoadEv = false) {
    if (isTopIframeShown) {
        bottom_e.src = url;
        bottom_e.onload = waitInnerContentLoadEv
            ? () => {}
            : () => {
                  showIframe(false);
              };
    } else {
        overlay_e.src = url;
        overlay_e.onload = waitInnerContentLoadEv
            ? () => {}
            : () => {
                  showIframe(true);
              };
    }

    // Update the current url on the server for preview purposes
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

/**
 *
 */
function setBackground(mode) {
    switch (mode) {
        case "_triangle":
            bottom_e.style.backgroundImage = "linear-gradient(160deg, rgb(255,255,255) 50%, hsl(318, 100%, 95%) 10%)";
            bottom_e.style.backgroundColor = "#ffffff";
            inFrameBackgroundMode = 0;
            break;
        case "_black":
            bottom_e.style.backgroundImage = "";
            bottom_e.style.backgroundColor = "#000000";
            inFrameBackgroundMode = 0;
            break;
        case "_white":
            bottom_e.style.backgroundImage = "";
            bottom_e.style.backgroundColor = "#ffffff";

            inFrameBackgroundMode = 0;
            break;
        case "_blur":
            inFrameBackgroundMode = 1;
            bottom_e.style.backgroundImage = "";
            bottom_e.style.backgroundColor = "#000000";
            break;
        case "_pic":
            bottom_e.style.backgroundImage = "";
            bottom_e.style.backgroundColor = "#000000";
            inFrameBackgroundMode = 2;
            break;
        default:
            let parts = mode.split(";:;");
            inFrameBackgroundMode = parts[0] == ";blur" ? 1 : parts[0] == ";pic" ? 2 : 0;
            bottom_e.style.backgroundImage = parts[2] ||"";
            bottom_e.style.backgroundColor = parts[1] || "#ffffff";
            inFrameBackgroundMode = 0;
            break;
    }
    overlay_e.style.backgroundColor = bottom_e.style.backgroundColor;
    overlay_e.style.backgroundImage = bottom_e.style.backgroundImage;
}

/**
 * Checks if the given url is a text file containing a link
 * @param {string} url The url to check
 * @returns {boolean} Whether or not the given url is a text file containing a link
 */
function isLinkText(url) {
    if (url.endsWith(".link.txt")) {
        return true;
    } else if (url.endsWith(".linktxt")) {
        return true;
    } else if (url.endsWith(".link")) {
        return true;
    }

    return false;
}

function init() {
    // Hide the overlay iframe
    showIframe(false);

    // Listen for messages from iframes
    window.onmessage = e => {
        if (e.data.type === "contentLoaded") showIframe(!isTopIframeShown);
    };

    // Start the interval
    window.interval = setInterval(interval, 1000);
    interval();
}

/**
 * The main interval function that fetches the meta data and switches slides
 */
async function interval() {
    /* ------------------------------ Meta refresh ------------------------------ */
    if (Date.now() > nextMetaRefetch) {
        try {
            // Fetch the meta data
            const res = await fetch("/api/view/pages/" + ref + ".json?t=" + Math.round(Date.now() / 1000));
            const data = await res.json();

            setBackground(data.backgroundMode || "$triangle");

            // Update the urls and the next meta refetch time
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
            // If there was an error, try again in 10 seconds
            console.error("Couldn't fetch meta:", e);
            nextMetaRefetch = Date.now() + 10000;
        }
    }

    /* ----------------------------- Slide switching ---------------------------- */
    if (Date.now() > nextSlideSwitch) {
        // Select the next url. Return to the first one if the last one was reached
        currentUrlIndex = (currentUrlIndex + 1) % urls.length;
        let url = urls[currentUrlIndex].url;

        if (isImage(url)) {
            // If the url is an image, use the custom image page

            // If the url is a relative path, add the origin
            if (!url.startsWith("http")) {
                url = window.location.origin + url;
            }

            showUrl(getImagePage(url,inFrameBackgroundMode), true);
        } else if (isLinkText(url)) {
            // If the url is a text file containing a link, fetch the link and show it
            const res = await fetch(url);
            const text = await res.text();

            showUrl(text, false);
        } else {
            // Otherwise, show the url directly
            showUrl(url, false);
        }

        // Update the next slide switch time
        nextSlideSwitch = urls[currentUrlIndex].duration * 1000 + Date.now();
    }
}

// Initialize and start
init();
