const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];

export function isImage(file) {
    return imageExtensions.includes(file.split(".").pop().toLowerCase());
}

export function getImagePage(url) {
    return (
        "data:text/html;base64," +
        btoa(
            `
            <html style="margin:0; padding: 0;">
            <body style="margin: 0; padding: 0;">
             <img src="${url}" alt="Image" style="width:100%;height:100%;object-fit:cover;" />
             </body>
             </html>
            `
        )
    );
}
