export const DEFAULT_GROUP_ID = "fd1b53aa-5f24-4c9a-9ce5-29108df75bf0";
export const JUST_WORK_GROUP_ID = "2f284bc9-30a4-4a5f-8527-7e8a40358144";

export const SERVER_ENDPOINTS = {
    data: "/api/admin/alldata.json",
    ls: "/api/admin/ls",

    setGroup: "/api/admin/setRefGroup",
    delGroup: "/api/admin/delRefGroup",
    setName: "/api/admin/setRefName",
    deleteRef: "/api/admin/deleteRef",

    setGroupName: "/api/admin/setGroupName",
    setGroupContent: "/api/admin/setGroupContent",
    createGroup: "/api/admin/createGroup",
    deleteGroup: "/api/admin/deleteGroup",
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

export const LOCAL_STORAGE_LANG_FIELD = "DisplayedAdmin:lang";
