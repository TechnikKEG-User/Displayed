const express = require("express"); // The Webserver Lib
const expressCsrf = require("express-csrf-protect");

const uuidv4 = require("uuid").v4; // uuidv4 generator
const MDNS = require("mdns"); // mDNS advertisement library
const cookieParser = require("cookie-parser"); // Cookie Parser Lib
const fs = require("fs"); // File System Lib
const { randomInt } = require("crypto"); // Cryptographically secure random number generator
const sanitizer = require("sanitizer"); // HTML escaping

/**Logo of the software */
const LOGO = `
+---------------------------------------------------+
###  # ### ###  #     ##  #  # #### ###  \\
#  # # #   #  # #    #  #  # # ###  #  # \\
#  # #   # ###  #    ####   #  #    #  # \\
###  # ##  #    #### #  #   #  #### ###  \\

#  # ####  ##    | For Karl-Ernst-Gymnasium
# #  #    #  #   |  Amorbach
##   ###  #      | by @Paddecraft (Patrick Ulbricht)
# #  #    # ##   | by @NprogramDev (Noah Pani)
#  # ####  ##    | supervised by Alexander Sitko

https://github.com/TechnikKEG/Displayed
+---------------------------------------------------+
`;

const app = express(); // The Webserver Object
app.use(expressCsrf.enableCsrfProtect());

/**
 * Webserver Configuration
 */
const HTTP_S = {
    HTTP_ON: (process.env.HTTP_ON || "true") == "true",
    HTTP_PORT: parseInt(process.env.HTTP_PORT || "80"),
    HTTPS_ON: process.env.HTTPS_ON == "true",
    HTTPS_PORT: parseInt(process.env.HTTPS_PORT || "443"),
    HTTPS_CERT: process.env.HTTPS_CERT || "",
    HTTPS_KEY: process.env.HTTPS_KEY || "",
};
/**
 * Units of time in milliseconds
 */
const UNIT_MS = {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,
    MONTH: 30 * 24 * 60 * 60 * 1000,
    YEAR: 365 * 24 * 60 * 60 * 1000,
};
/*
 * Default Background Mode
 */
let bgMode = process.env.BACKGROUND_MODE || "_triangle";
/*
 * Default Exprie Date
 */
const DEFAULT_EXPIRE_DATE = 12 * UNIT_MS.HOUR;

/**
 * Session Handler for Admin Page Login
 */
class SessionHndl {
    constructor() {
        this.sessions = {};
    }
    /**
     * A util function to generate a random token
     * @returns {string} A random token
     */
    getRandomToken() {
        let rt = "";
        for (let i = 0; i < 32; i++) {
            rt += String.fromCharCode(randomInt(33, 127));
        }
        return rt;
    }
    /**
     * Creates a new session and sets the cookie
     * @param {Response} res The response object
     * @returns {void}
     */
    createSession(res) {
        let token = null;
        do {
            token = this.getRandomToken();
        } while (this.sessions[token] != undefined);
        this.sessions[token] = {
            expires: DEFAULT_EXPIRE_DATE + new Date().getTime(),
        };
        res.cookie("sessionID", token, {
            maxAge: DEFAULT_EXPIRE_DATE,
            httpOnly: true,
        });
        res.sendFile(__dirname + PATH + "/index.html");
    }
    /**
     * Renew the session by setting the cookie again
     * @param {string} token The token of the session
     * @param {Response} res The response object
     * @returns {void}
     */
    renewSession(token, res) {
        this.sessions[token].expires =
            DEFAULT_EXPIRE_DATE + new Date().getTime();
        res.cookie("sessionID", token, {
            maxAge: DEFAULT_EXPIRE_DATE,
            httpOnly: true,
        });
    }
    /**
     * Check if the session is valid
     * @param {string} token The token of the session
     * @param {Response} res The response object
     * @returns {boolean} True if the session is valid
     */
    checkSession(token, res) {
        // Delete Exp Sessions
        for (const key in this.sessions) {
            if (this.sessions[key].expires < new Date().getTime()) {
                delete this.sessions[key];
            }
        }
        if (this.sessions[token] == undefined) {
            return false;
        }
        this.renewSession(token, res);
        return true;
    }
    /**
     * Authentication Function
     * @param {Request} req The request object
     * @param {Response} res The response object
     * @param {string} authHeader The Authorization Header
     * @returns {string} Null if the authentication was successful
     */
    auth(req, res, authHeader) {
        const [type, credentials] = authHeader.split(" ");

        if (type !== "Basic" || !credentials) {
            return "Invalid Authorization Header";
        }
        const decodedCredentials = Buffer.from(credentials, "base64").toString(
            "utf-8"
        );
        const [username, password] = decodedCredentials.split(":");
        return storage.checkPassword(password, username)
            ? null
            : "Invalid Password or Username";
    }
    /**
     * Ask for authentication
     * @param {Request} req The request object
     * @param {Response} res The response object
     * @param {string} error The error message
     * @returns {void}
     */
    askAuth(req, res, error = "Authentication required.") {
        res.setHeader("X-Auth-Error", error);
        res.status(401).sendFile(__dirname + PATH + "/auth.html");
    }
    /**
     * Check if the session is valid or ask for authentication
     * @param {Request} req The request object
     * @param {Response} res The response object
     * @param {boolean} redirect If true the function will redirect to the login page
     * @returns {boolean} True if the session is valid
     */
    check(req, res, redirect = false) {
        let session = req.cookies.sessionID;
        // If the session is valid => continue
        if (this.checkSession(session, res)) return true;
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.error("No Auth Header");
            this.askAuth(req, res);
            return false;
        }
        let authError = this.auth(req, res, authHeader);
        if (authError != null) {
            this.askAuth(req, res, authError);
            return false;
        }
        this.createSession(res);
        return true;
    }
    /**
     * Logout the user
     * @param {Request} req The request object
     * @param {Response} res The response object
     * @returns {void}
     */
    logout(req, res) {
        let session = req.cookies.sessionID;
        delete this.sessions[session];
        res.clearCookie("sessionID");
    }
}
/** The general session handler */
const sessionHndl = new SessionHndl();
/** The path where all the published files are */
const PATH = "/public";
/** The path of default published folder */
const MOUNT = "/mount";
/** The path of all static content (imaginary / test) files */
const IMAGEN = "/imagen";
/** The webserver handler for https*/
var https = require("https");
/** The webserver handler for http*/
var http = require("http");

app.use("/static", express.static(__dirname + PATH + "/static")); // publish the static files, that
app.use(MOUNT, express.static(__dirname + PATH + MOUNT)); // publish the mount folder
app.use(IMAGEN, express.static(__dirname + PATH + IMAGEN)); // publish the Imagen folder
app.use(cookieParser()); // Add a cookieParser for simpler cookie handling

/**
 * Custom Storage Handler
 * => storage.js
 */
const storage = require("./storage"); // Import the custom storage handler & Password
const { pathContains } = require("./lib/path");

/**DEFAULT GROUP UUID */
const DEFAULT_GROUP = storage.DEFAULT_GROUP;
storage.get(); // Load the config file before anything else
// Print Server Logo
for (let logo of LOGO.split("\n")) {
    console.log(logo);
}
function error(msg) {
    console.error(msg);
}

app.get("/", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!sessionHndl.check(req, res, true)) return;
    res.sendFile(__dirname + PATH + "/index.html");
});

app.get("/favicon.ico", (req, res) => {
    res.sendFile(__dirname + PATH + "/favicon.ico");
});

app.get("/logout", (req, res) => {
    sessionHndl.logout(req, res);
    res.redirect("/");
});

/* -------------------------------------------------------------------------- */
/*                                  View API                                  */
/* -------------------------------------------------------------------------- */
app.get("/view.html", (req, res) => {
    let conf = storage.get();
    if (Object.keys(conf.refs).indexOf(req.query.ref) == -1) {
        conf.refs[req.query.ref] = {
            name: "MAC:" + req.query.ref,
            group: [],
            preview: "No Preview Available",
        };
    }
    storage.save(conf);
    res.sendFile(__dirname + PATH + "/view.html");
});

/**
 * Reads the url folder recursively and returns the files as urls
 */
function getFolderAsUrls(url, duration) {
    let urls = [];
    fs.readdirSync(__dirname + PATH + url).forEach((file) => {
        // if file is a directory continue

        if (fs.lstatSync(__dirname + PATH + url + "/" + file).isDirectory()) {
            urls.concat(getFolderAsUrls(url + "/" + file, duration));
            return;
        }
        urls.push({ duration: duration, url: url + "/" + file });
    });
    return urls;
}
/**
 * Get the current pages for a specific device by ref which is the MAC address
 */
app.get("/api/view/pages/:page", (req, res) => {
    // Delete .json file ending
    let pathx = req.params.page.split(".");
    pathx.pop();
    let mac = pathx.join(".");
    // Get configuration
    let conf = storage.get();
    // Check of device
    if (conf.refs[mac] == undefined) {
        error("Ref not found! MAC: " + mac);
        res.send("Ref not found! MAC: " + sanitizer(mac));
        return;
    }
    // Get groups
    let cGroups = conf.refs[mac].group;
    if (cGroups.length == 0) {
        cGroups = [DEFAULT_GROUP];
    }
    // Collect all pages
    let pages = [];
    let minimum_reload = conf.groups[cGroups[0]].reload;
    cGroups.forEach((cGroup) => {
        if (conf.groups[cGroup] == undefined) {
            error("Group not found! Group: " + cGroup);
            res.send("Group not found! Group: " + cGroup);
            return;
        }
        if (conf.groups[cGroup].reload < minimum_reload) {
            minimum_reload = conf.groups[cGroup].reload;
        }
        for (const url of conf.groups[cGroup].urls) {
            if (url.url.endsWith("/")) {
                pages = pages.concat(
                    getFolderAsUrls(
                        url.url.substring(0, url.url.length - 1),
                        url.duration
                    )
                );
            } else pages.push(url);
        }
    });
    // Sort urls files by alphabetical order
    pages.sort((a, b) => {
        let urlA = a.url.split("/").pop();
        let urlB = b.url.split("/").pop();
        if (urlA < urlB) return -1;
        if (urlA > urlB) return 1;
        return 0;
    });
    res.send(
        JSON.stringify(
            { reload: minimum_reload, urls: pages, backgroundMode: bgMode },
            null,
            4
        )
    );
});

function readdirRecursive(path) {
    let rt = [];
    let files = fs.readdirSync(path);
    files.forEach((file) => {
        let fPath = path + "/" + file;
        if (fs.lstatSync(fPath).isDirectory()) {
            let crt = readdirRecursive(fPath);
            if (crt.length > 0) {
                rt = rt.concat(crt);
            } else {
                rt.push({ isDir: true, path: fPath });
            }
        } else {
            rt.push({ isDir: false, path: fPath });
        }
    });
    return rt;
}

app.put("/api/view/currUrl", express.json(), (req, res) => {
    //
    let conf = storage.get();
    let mac = req.body.ref;
    let url = req.body.url;
    if (conf.refs[mac] == undefined) {
        error("Ref not found! MAC: " + mac);
        //res.send("Ref not found! MAC: " + mac);
        return;
    }
    conf.refs[mac].preview = url;
    storage.save(conf);
    res.send("OK");
});

/* -------------------------------------------------------------------------- */
/*                                  Admin API                                 */
/* -------------------------------------------------------------------------- */

app.get("/api/admin/ls", (req, res) => {
    if (!sessionHndl.check(req, res)) return;
    let path =
        __dirname + PATH + MOUNT + (req.query.path ? req.query.path : "");

    // Ensure that the path is in the mount folder
    if (!pathContains(path, __dirname + PATH + MOUNT)) {
        error("Path not in mount folder! Path: " + path);
        res.send("Path not in mount folder! Path: " + sanitizer(path));
    }

    let rt = readdirRecursive(path);
    if (req.query.path == undefined) {
        rt = rt.concat(readdirRecursive(__dirname + PATH + IMAGEN));
    }
    // Remove the _dirname from ever entry in rt
    rt.forEach((entry) => {
        entry.path = entry.path.replace(__dirname + PATH, "");
    });
    res.send(JSON.stringify(rt, null, 4));
});

app.get("/api/admin/alldata.json", (req, res) => {
    if (!sessionHndl.check(req, res)) return;
    let strCl = structuredClone(storage.get());
    strCl["user"] = undefined;
    res.send(JSON.stringify(strCl, null, 4));
});

app.patch("/api/admin/setRefGroup", (req, res) => {
    if (!sessionHndl.check(req, res)) return;
    let conf = storage.get();
    if (conf.refs[req.query.ref] == undefined) {
        error("setRefGroup ;Ref not found! MAC: " + req.query.ref);
        return;
    }
    if (conf.refs[req.query.ref].group.constructor.name === "String") {
        let orig = conf.refs[req.query.ref].group;
        conf.refs[req.query.ref].group = [];
        if (orig != storage.DEFAULT_GROUP) {
            conf.refs[req.query.ref].group.push(orig);
        }
    }
    conf.refs[req.query.ref].group.push(req.query.group);
    storage.save(conf);
    res.send("OK");
});

app.patch("/api/admin/delRefGroup", (req, res) => {
    if (!sessionHndl.check(req, res)) return;
    let conf = storage.get();
    if (conf.refs[req.query.ref] == undefined) {
        error("setRefGroup ;Ref not found! MAC: " + req.query.ref);
        return;
    }
    if (conf.refs[req.query.ref].group.constructor.name === "String") {
        conf.refs[req.query.ref].group = [req.query.group];
    }
    let idx = conf.refs[req.query.ref].group.indexOf(req.query.group);
    if (idx == -1) {
        error("delRefGroup ;Group not found! MAC: " + req.query.ref);
        return;
    }
    conf.refs[req.query.ref].group.splice(idx, 1);

    storage.save(conf);
    res.send("OK");
});

app.patch("/api/admin/setGroupName", (req, res) => {
    if (!sessionHndl.check(req, res)) return;
    let conf = storage.get();
    if (conf.groups[req.query.group] == undefined) {
        error("setGroupName ;Group not found! UUID: " + req.query.group);
        return;
    }
    conf.groups[req.query.group].name = req.query.name;
    storage.save(conf);
    res.send("OK");
});

app.patch("/api/admin/setRefName", (req, res) => {
    if (!sessionHndl.check(req, res)) return;
    let conf = storage.get();
    if (conf.refs[req.query.ref] == undefined) {
        error("setRefName ;Ref not found! MAC: " + req.query.ref);
        return;
    }
    conf.refs[req.query.ref].name = req.query.name;
    storage.save(conf);
    res.send("OK");
});

app.delete("/api/admin/deleteGroup", (req, res) => {
    if (!sessionHndl.check(req, res)) return;
    let conf = storage.get();
    if (conf.groups[req.query.group] == undefined) {
        error("deleteGroup ;Group not found! UUID: " + req.query.group);
        return;
    }
    if (req.query.group == JUST_WORK_GROUP) {
        error("deleteGroup ;Can't delete default group!");
        return;
    }
    if (conf.groups[req.query.group].readonly) {
        error("deleteGroup ;Group is readonly! UUID: " + req.query.group);
        return;
    }
    delete conf.groups[req.query.group];
    storage.save(conf);
    res.send("OK");
});

app.delete("/api/admin/deleteRef", (req, res) => {
    if (!sessionHndl.check(req, res)) return;
    let conf = storage.get();
    if (conf.refs[req.query.ref] == undefined) {
        error("deleteRef ;Ref not found! MAC: " + req.query.ref);
        return;
    }
    delete conf.refs[req.query.ref];
    storage.save(conf);
    res.send("OK");
});

app.put("/api/admin/setGroupContent", express.json(), (req, res) => {
    if (!sessionHndl.check(req, res)) return;
    let conf = storage.get();
    let body = req.body;
    let uuid = req.query.group;
    if (conf.groups[uuid] == undefined) {
        error("setGroupContent ;Group not found! UUID: " + uuid);
        return;
    }
    if (conf.groups[uuid].readonly) {
        error("setGroupContent ;Group is readonly! UUID: " + uuid);
        return;
    }
    conf.groups[uuid].name = body.name;
    conf.groups[uuid].reload = body.reload;
    conf.groups[req.query.group].urls = body.urls;
    storage.save(conf);
    res.send("OK");
});

const CREATE_GROUP_ERROR_NO_NAME = {
    status: "error",
    message: "No Name Provided",
};
const CREATE_GROUP_ERROR_NAME_EXISTS = {
    status: "error",
    message: "Name Already Exists",
};

app.post("/api/admin/createGroup", (req, res) => {
    if (!sessionHndl.check(req, res)) return;
    let conf = storage.get();
    let rt = {
        status: "ok",
        uuid: "",
    };
    // Name Check
    if (req.query.name == undefined)
        return res.send(JSON.stringify(CREATE_GROUP_ERROR_NO_NAME, null, 4));
    if (
        Object.values(conf.groups).filter((x) => x.name == req.query.name)
            .length > 0
    )
        return res.send(
            JSON.stringify(CREATE_GROUP_ERROR_NAME_EXISTS, null, 4)
        );
    // Generate UUID
    do {
        rt.uuid = uuidv4();
    } while (Object.keys(conf.groups).indexOf(rt.uuid) != -1);
    conf.groups[rt.uuid] = {
        name: req.query.name,
        reload: 120,
        readonly: false,
        urls: [],
    };
    storage.save(conf);

    res.send(JSON.stringify(rt, null, 4));
});

app.get("/api/admin/changePassword", (req, res) => {
    if (!sessionHndl.check(req, res)) return;
    let oldPassword = req.query.oldPassword;
    let newPassword = req.query.password;

    oldPassword = atob(oldPassword);
    newPassword = atob(newPassword);

    if (!storage.checkPassword(oldPassword))
        return res.status(401).send("ERR: Incorrect Password");
    storage.setPassword(newPassword);
    sessionHndl.logout(req, res);
    res.send("OK");
});

const advertisement = MDNS.createAdvertisement(
    MDNS.tcp("displayed-srv"),
    HTTP_S.HTTPS_ON ? HTTP_S.HTTPS_PORT : HTTP_S.HTTP_PORT
);
advertisement.start();

if (HTTP_S.HTTP_ON) http.createServer(app).listen(HTTP_S.HTTP_PORT);
if (HTTP_S.HTTPS_ON)
    https
        .createServer({ key: HTTP_S.HTTPS_KEY, cert: HTTP_S.HTTPS_CERT }, app)
        .listen(HTTP_S.HTTPS_PORT);
