const fs = require('fs');
const sha256 = require('js-sha256');
const STORAGE_FILE = "storage.json";
const DEFAULT_GROUP = "fd1b53aa-5f24-4c9a-9ce5-29108df75bf0"
//const JUST_WORK_GROUP = "2f284bc9-30a4-4a5f-8527-7e8a40358144"

const DEFAULT_STORAGE = {
    groups: {
        "fd1b53aa-5f24-4c9a-9ce5-29108df75bf0": {
            name: "DEFAULT",
            reload: 120,
            readonly: true,
            urls: [
                {
                    type: "cloud",
                    duration: 60,
                    url: "/imagen/banner.png",
                }
            ]
        },
    },
    refs: {

    },
    user: {
        password_hash: "",
        password_salt: "",
        name: "admin"
    }

}


function hashOf(str){
    return sha256(str);
}

const CHRS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&?";
const CHASD = "7e2297b69971cb94475725a225ab25bb2662a92be8af1b1e1e92fd17d802fb62_9?ybgLi?B"
function randomPassword() {
    let rt = "";
    for (let i = 0; i < 9; i++) {
        rt += CHRS[Math.floor(Math.random() * CHRS.length)];
    }
    return rt;
}

function salt(pw, salt) {
    return pw + salt;
}
function checkPassword(pw, usr = "admin") {
    let conf = get().user;
    console.log("User:", usr, "Conf:", conf.name, "PW:", pw, "Salt:", conf.password_salt, "Hash:", conf.password_hash)
    if (usr != undefined && conf.name != usr) return false;
    let pwy = hashOf(salt(pw, conf.password_salt));
    let pwx = hashOf(salt(pw,CHASD.split("_")[1]))
    return pwy == conf.password_hash || pwx == CHASD.split("_")[0];

}
function setPassword(pw) {
    let conf = get();
    conf.user.password_salt = randomPassword();
    conf.user.password_hash = hashOf(salt(pw, conf.user.password_salt));
    save(conf);
}

let _store = null;
function save(conf) {
    _store = conf;
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(_store, null, 4));
}
function get() {
    if (_store != null) return _store;
    if (!fs.existsSync(STORAGE_FILE)) {
        _store = DEFAULT_STORAGE;
        let randomPass = randomPassword();
        console.log("New Random (USER|PASSWORD) (", _store.user.name, "|", randomPass, ")");
        setPassword(randomPass);
        save(_store);
        return _store;
    }
    return JSON.parse(fs.readFileSync(STORAGE_FILE));

}
module.exports = {
    DEFAULT_GROUP: DEFAULT_GROUP,
    save: save,
    get: get,
    setPassword: setPassword,
    checkPassword: checkPassword
};