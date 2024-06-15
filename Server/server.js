const express = require("express");
const app = express();
const uuidv4 = require('uuid').v4;
const cookieParser = require('cookie-parser');
const fs = require('fs');
const HTTP_S = {
    HTTP_ON: true,
    HTTP_PORT: 80,
    HTTPS_ON: false,
    HTTPS_PORT: 443,
    HTTPS_CERT: "",
    HTTPS_KEY: ""
}
const UNIT_MS = {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,
    MONTH: 30 * 24 * 60 * 60 * 1000,
    YEAR: 365 * 24 * 60 * 60 * 1000
}
const DEFAULT_EXPIRE_DATE = 12 * UNIT_MS.HOUR;

class SessionHndl {
    constructor() {
        this.sessions = {

        };
    }
    getRandomToken() {
        let rt = "";
        for (let i = 0; i < 32; i++) {
            rt += String.fromCharCode(Math.floor(Math.random() * 94) + 33);
        }
        return rt;
    }
    createSession(res) {
        let token = null;
        do {
            token = this.getRandomToken();
        } while (this.sessions[token] != undefined);
        this.sessions[token] = { expires: DEFAULT_EXPIRE_DATE + (new Date().getTime()) };
        res.cookie("sessionID", token, { maxAge: DEFAULT_EXPIRE_DATE });
        res.sendFile(__dirname + PATH + "/index.html");
    }
    renewSession(token, res) {
        this.sessions[token].expires = DEFAULT_EXPIRE_DATE + (new Date().getTime());
        res.cookie("sessionID", token, { maxAge: DEFAULT_EXPIRE_DATE });
    }
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
    // True if need login again
    auth(req, res, authHeader) {
        const [type, credentials] = authHeader.split(' ');

        if (type !== 'Basic' || !credentials) {
            return "Invalid Authorization Header";
        }
        const decodedCredentials = Buffer.from(credentials, 'base64').toString('utf-8');
        const [username, password] = decodedCredentials.split(':');
        return storage.checkPassword(password, username) ? null : "Invalid Password or Username";
    }
    askAuth(req, res, error = "Authentication required.") {
        res.setHeader('X-Auth-Error', error);
        res.status(401).sendFile(__dirname + PATH + "/auth.html");
    }
    check(req, res, redirect = false) {
        let session = req.cookies.sessionID;
        // If the session is valid => continue
        console.log(this);
        if (this.checkSession(session, res)) return true;
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.log("No Auth Header");
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
    logout(req, res) {
        let session = req.cookies.sessionID;
        delete this.sessions[session];
        res.clearCookie("sessionID");

    }
}
const sessionHndl = new SessionHndl();
const PATH = "/public"
const MOUNT = "/mount"
var https = require('https');
var http = require('http');

app.use("/static", express.static(__dirname + PATH + "/static"));
app.use(MOUNT, express.static(__dirname + PATH + MOUNT));
app.use(cookieParser());

const storage = require("./storage");
const DEFAULT_GROUP = storage.DEFAULT_GROUP;
const JUST_WORK_GROUP = storage.JUST_WORK_GROUP;
storage.get();
console.log("Server Started");

function error(msg) {
    console.error(msg);
}
app.get("/", (req, res) => {
    res.setHeader("Cache-Control", "no-store")
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
/**
 * View API
 */
app.get("/view.html", (req, res) => {
    let conf = storage.get();
    if (Object.keys(conf.refs).indexOf(req.query.ref) == -1) {
        conf.refs[req.query.ref] = {
            name: "MAC:" + req.query.ref,
            group: DEFAULT_GROUP,
            preview: "No Preview Available",
        }
    }
    storage.save(conf);
    res.sendFile(__dirname + PATH + "/view.html");
});
function getJustWork() {
    const conf = storage.get();
    let urls = [];
    let generalDuration = 0;
    let folder = "";
    conf.groups[JUST_WORK_GROUP].urls.forEach((url) => {
        if (url.url == "generalDuration") {
            generalDuration = url.duration;
        }
        if (url.url == "folder") {
            folder = url.duration;
        }
    });
    folder = folder == "" ? "/" : folder;
    fs.readdirSync(__dirname + PATH + folder).forEach(file => {
        urls.push({ duration: generalDuration, url: folder + "/" + file });
    });
    urls.sort((a, b) => {
        let urla = a.url.split("/");
        urla = urla[urla.length - 1]
        let urlb = b.url.split("/");
        urlb = urlb[urlb.length - 1];
        urla = urla.toLowerCase();
        urlb = urlb.toLowerCase();

        if (urla < urlb) {
            return -1;
        }
        if (urla > urlb) {
            return 1;
        }
        return 0;
    })
    return {
        reload: conf.groups[JUST_WORK_GROUP].reload,
        urls: urls
    }
}


app.get("/api/view/pages/:page", (req, res) => {
    let pathx = req.params.page.split(".");
    pathx.pop();
    let mac = pathx.join(".");
    let conf = storage.get();
    if (conf.refs[mac] == undefined) {
        error("Ref not found! MAC: " + mac);
        res.send("Ref not found! MAC: " + mac);
        return;
    }
    const cGroup = conf.refs[mac].group;
    if (cGroup == JUST_WORK_GROUP) {
        res.send(JSON.stringify(getJustWork(), null, 4));
        return;
    }
    const cGroupConf = conf.groups[cGroup];
    if (cGroupConf == undefined) {
        error("pages/ ;Group not found! Group: " + cGroup);
        res.send("pages/ ;Group not found! Group: " + cGroup);
        return;
    }
    res.send(JSON.stringify({ reload: cGroupConf.reload, urls: cGroupConf.urls }, null, 4))
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

app.get("/api/admin/ls", (req, res) => {
    if (!sessionHndl.check(req, res)) return;
    let path = __dirname + PATH + MOUNT + (req.query.path ? req.query.path : "");
    console.log(path);
    let rt = readdirRecursive(path);
    console.log(rt)
    // Remove the _dirname from ever entry in rt
    rt.forEach((entry) => {
        entry.path = entry.path.replace(__dirname + PATH, "");
    });
    res.send(JSON.stringify(rt, null, 4));
})
app.put("/api/view/currUrl", (req, res) => {
    //
    let conf = storage.get();
    let mac = req.query.ref;
    let url = req.query.url;
    if (conf.refs[mac] == undefined) {
        error("Ref not found! MAC: " + mac);
        //res.send("Ref not found! MAC: " + mac);
        return;
    }
    conf.refs[mac].preview = url;
    storage.save(conf);
})

/**
 * Admin API
 */

app.get("/api/admin/alldata.json", (req, res) => {
    if (!sessionHndl.check(req, res)) return;
    let strCl = structuredClone(storage.get());
    strCl["user"] = undefined;
    res.send(JSON.stringify(strCl, null, 4));
});

app.patch("/api/admin/setRefGroup", (req, res) => {
    if (!sessionHndl.check(req, res)) return;
    let conf = storage.get();
    if (conf.refs[req.query.ref] == undefined) { error("setRefGroup ;Ref not found! MAC: " + req.query.ref); return; }
    conf.refs[req.query.ref].group = req.query.group;
    storage.save(conf);
});
app.patch("/api/admin/setGroupName", (req, res) => {
    if (!sessionHndl.check(req, res)) return;
    let conf = storage.get();
    if (conf.groups[req.query.group] == undefined) { error("setGroupName ;Group not found! UUID: " + req.query.group); return; }
    conf.groups[req.query.group].name = req.query.name;
    storage.save(conf);
});
app.patch("/api/admin/setRefName", (req, res) => {
    if (!sessionHndl.check(req, res)) return;
    let conf = storage.get();
    if (conf.refs[req.query.ref] == undefined) { error("setRefName ;Ref not found! MAC: " + req.query.ref); return; }
    conf.refs[req.query.ref].name = req.query.name;
    storage.save(conf);
    res.send("OK");
});
app.put("/api/admin/setGroupContent", express.json(), (req, res) => {
    if (!sessionHndl.check(req, res)) return;
    let conf = storage.get();
    let body = req.body;
    let uuid = req.query.group;
    if (conf.groups[uuid] == undefined) { error("setGroupContent ;Group not found! UUID: " + uuid); return; }
    if (conf.groups[uuid].readonly) { error("setGroupContent ;Group is readonly! UUID: " + uuid); return; }
    conf.groups[uuid].name = body.name;
    conf.groups[uuid].reload = body.reload;
    conf.groups[req.query.group].urls = body.urls;
    storage.save(conf);
});

const CREATE_GROUP_ERROR_NO_NAME = {
    status: "error",
    message: "No Name Provided"
}
const CREATE_GROUP_ERROR_NAME_EXISTS = {
    status: "error",
    message: "Name Already Exists"
}

app.post("/api/admin/createGroup", (req, res) => {
    if (!sessionHndl.check(req, res)) return;
    let conf = storage.get();
    let rt = {
        status: "ok",
        uuid: ""
    };
    // Name Check
    if (req.query.name == undefined) return res.send(JSON.stringify(CREATE_GROUP_ERROR_NO_NAME, null, 4));
    if (Object.values(conf.groups).filter(x => x.name == req.query.name).length > 0) return res.send(JSON.stringify(CREATE_GROUP_ERROR_NAME_EXISTS, null, 4));
    // Generate UUID
    do {
        rt.uuid = uuidv4();
    } while (Object.keys(conf.groups).indexOf(rt.uuid) != -1);
    conf.groups[rt.uuid] = {
        name: req.query.name,
        reload: 120,
        readonly: false,
        urls: []
    }
    storage.save(conf);

    res.send(JSON.stringify(rt, null, 4));
});

app.get("/api/admin/changePassword", (req, res) => {
    if (!sessionHndl.check(req, res)) return;
    let oldPassword = req.query.oldPassword;
    let newPassword = req.query.password;

    oldPassword = atob(oldPassword);
    newPassword = atob(newPassword);

    console.log(oldPassword, newPassword);

    if (!storage.checkPassword(oldPassword)) return res.status(401).send("ERR: Incorrect Password");
    storage.setPassword(newPassword);
    sessionHndl.logout(req, res);
    res.send("OK");
});

if (HTTP_S.HTTP_ON) http.createServer(app).listen(HTTP_S.HTTP_PORT);
if (HTTP_S.HTTPS_ON) https.createServer({ key: HTTP_S.HTTPS_KEY, cert: HTTP_S.HTTPS_CERT }, app).listen(HTTP_S.HTTPS_PORT);