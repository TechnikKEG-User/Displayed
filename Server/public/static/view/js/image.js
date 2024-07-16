const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];

/**
 * Check if the url or path is an image based on extension
 * @param {string} file url or path of the file
 * @returns {boolean} true if the file is an image
 */
export function isImage(file) {
    return imageExtensions.includes(file.split(".").pop().toLowerCase());
}

/**
 * Get the image page with the image url
 * @param {string} url url of the image
 * @param {number} bgMode background mode 0: none, 1: blur, 2: image
 * @returns {string} html page with the image as data url
 * @example getImagePage("https://example.com/image.jpg");
 */
export function getImagePage(url, bgMode) {
    return (
        "data:text/html;base64," +
        btoa(
            `
            <!DOCTYPE html>
            <html style="margin:0; padding: 0; width: 100dvw; height: 100dvh; overflow: hidden;">
                <body style="margin: 0; padding: 0; width: 100dvw; height: 100dvh;">
                    ` +
                (bgMode > 0
                    ? `<img src="${url}" alt="Image Backdrop" style="width: 100dvw; height: 100dvh; object-fit: cover; margin: 0; padding: 0; border: 0; z-index: 1;" />`
                    : "") +
                `
                    <img src="${url}" alt="Image" style="width: 100dvw; height: 100dvh; object-fit: contain; margin: 0; padding: 0; border: 0; z-index: 10;` +
                (bgMode != 2 ? ` backdrop-filter: blur(20px); ` : "") +
                ` position: absolute; top: 0; left: 0;" />
                    <script>
                        let img = document.getElementsByTagName("img")[0];
                        ` +
                (bgMode > 0
                    ? `let imgBackdrop = document.getElementsByTagName("img")[1];

                        let counter = 0;

                        function load() {
                            counter++;
                            if (counter === 2) {
                                window.top.postMessage({ type: "contentLoaded" }, "*");
                            }
                        }
                        
                        img.onload = load
                        imgBackdrop.onload = load`
                    : `
                        img.onload = () => {
                            window.top.postMessage({ type: "contentLoaded" }, "*");
                        };
                        `) +
                `
                    </script>
                </body>
            </html>
            `
        )
    );
}
