const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];

export function isImage(file) {
    return imageExtensions.includes(file.split(".").pop().toLowerCase());
}

export function getImagePage(base64, format) {
    return (
        "data:text/html;base64," +
        btoa(
            `
             <img src="data:image/${format};base64,${base64}" alt="Image" style="width:100%;height:100%;object-fit:cover;" />
            `
        )
    );
}
