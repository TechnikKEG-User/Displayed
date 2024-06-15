import { changePasswordTitle_e, changePasswordOldPWLabel_e, changePasswordNewPWLabel_e, changePasswordConfirmPWLabel_e, changePasswordSubmit_e, changePasswordApp_e, changePasswordNewPW_e, changePasswordOldPW_e, changePasswordConfirmPW_e } from "./elements.js";
import { getLanguageData } from "./lang.js";

let wasInit = false;
function init() {
    const lang = getLanguageData();
    changePasswordTitle_e.innerText = lang.login.change_password;
    changePasswordOldPWLabel_e.innerText = lang.login.old_password;
    changePasswordNewPWLabel_e.innerText = lang.login.new_password;
    changePasswordConfirmPWLabel_e.innerText = lang.login.confirm_password;
    changePasswordSubmit_e.innerText = lang.login.change_password;

    let bt = false;

    function chx(e) {
        if (changePasswordNewPW_e.value === changePasswordConfirmPW_e.value) {
            changePasswordNewPW_e.style.borderColor = "#55ff22";
            changePasswordConfirmPW_e.style.borderColor = "#55ff22";
            bt = true;
        } else {
            changePasswordNewPW_e.style.borderColor = "#ff2222";
            changePasswordConfirmPW_e.style.borderColor = "#ff2222";
            bt = false;
        }
    }

    changePasswordNewPW_e.onchange = chx;
    changePasswordConfirmPW_e.onchange = chx;

    changePasswordSubmit_e.onclick = async () => {
        if (!bt) { alert("Passwords do not match"); return; }
        let oldPassword = changePasswordOldPW_e.value;
        let newPassword = changePasswordNewPW_e.value;
        oldPassword = btoa(oldPassword);
        newPassword = btoa(newPassword);

        const res = await fetch("/api/admin/changePassword?oldPassword=" + oldPassword + "&password=" + newPassword, {
            method: "GET"
        });
        if (res.status === 200) {
            changePasswordOldPW_e.value = "";
            changePasswordNewPW_e.value = "";
            changePasswordConfirmPW_e.value = "";
            location.reload();
        } else {
            alert("Failed to change password");
        }
    };

    wasInit = true;
}
export function changePasswordShow() {
    if (!wasInit) init();
    changePasswordApp_e.style.display = "";
}