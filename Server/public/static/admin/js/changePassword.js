import {
    changePasswordTitle_e,
    changePasswordOldPWLabel_e,
    changePasswordNewPWLabel_e,
    changePasswordConfirmPWLabel_e,
    changePasswordSubmit_e,
    changePasswordNewPW_e,
    changePasswordOldPW_e,
    changePasswordConfirmPW_e,
} from "./elements.js";
import { formatString, getLanguageData } from "./lang.js";

export function initChangePassword() {
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

    changePasswordNewPW_e.onkeyup = chx;
    changePasswordConfirmPW_e.onkeyup = chx;

    changePasswordSubmit_e.onclick = async () => {
        if (!bt) {
            alert(formatString(lang.login.passwords_not_match, {}));
            return;
        }
        let oldPassword = changePasswordOldPW_e.value;
        let newPassword = changePasswordNewPW_e.value;
        oldPassword = btoa(oldPassword);
        newPassword = btoa(newPassword);

        const res = await fetch("/api/admin/changePassword", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                oldPassword: oldPassword,
                password: newPassword,
            }),
        });

        if (res.status === 200) {
            changePasswordOldPW_e.value = "";
            changePasswordNewPW_e.value = "";
            changePasswordConfirmPW_e.value = "";
            location.reload();
        } else {
            alert(formatString(lang.login.error_changing_password, {}));
        }
    };
}
