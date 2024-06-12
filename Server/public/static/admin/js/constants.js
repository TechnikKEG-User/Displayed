export const DEFAULT_GROUP_ID = "DEFAULT";

export const SERVER_ENDPOINTS = {
    data: "/api/admin/alldata.json",
    ls: "/api/admin/ls",

    setGroup: "/api/admin/setRefGroup",
    setName: "/api/admin/setRefName",

    setGroupName: "/api/admin/setGroupName",
    setGroupContent: "/api/admin/setGroupContent",
    createGroup: "/api/admin/createGroup",
};

// Format: dispatcher:event-name
export const EVENTS = {
    // Group events
    groupSelect: "sidebar:group-select",
    groupAdd: "sidebar:group-add",
    groupDelete: "main:group-delete",

    // Slide events
    slidesModified: "main:slides-modified",

    // Other events
    reload: "main:reload",
};
