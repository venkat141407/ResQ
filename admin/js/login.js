const API_URL = "/api";

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("adminLoginForm");

    if (!form) {
        console.error("Admin login form not found.");
        return;
    }

    form.addEventListener("submit", handleAdminLogin);
});


async function handleAdminLogin(event) {

    event.preventDefault();

    const emailInput =
        document.getElementById("adminEmail");

    const passwordInput =
        document.getElementById("adminPassword");

    const button =
        document.querySelector(
            "#adminLoginForm button[type='submit']"
        );

    const email =
        emailInput.value.trim().toLowerCase();

    const password =
        passwordInput.value;

    clearMessage();


    if (!email || !password) {
        showMessage(
            "Please enter your email and password.",
            "error"
        );
        return;
    }


    if (!isValidEmail(email)) {
        showMessage(
            "Please enter a valid email address.",
            "error"
        );
        return;
    }


    setLoading(button, true);


    try {

        const response = await fetch(
            `${API_URL}/auth/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            showMessage(
                data.message ||
                "Invalid email or password.",
                "error"
            );

            return;
        }


        if (
            !data.success ||
            !data.token ||
            !data.user
        ) {

            showMessage(
                data.message ||
                "Unable to complete admin login.",
                "error"
            );

            return;
        }


        /*
         * Only an account with role "admin"
         * can access the admin panel.
         */

        if (data.user.role !== "admin") {

            showMessage(
                "Access denied. This account is not an administrator.",
                "error"
            );

            return;
        }


        /*
         * Save authentication details.
         */

        localStorage.setItem(
            "resqToken",
            data.token
        );

        localStorage.setItem(
            "resqUser",
            JSON.stringify(data.user)
        );


        showMessage(
            "Admin login successful. Opening control center...",
            "success"
        );


        setTimeout(() => {

            window.location.href =
                "dashboard.html";

        }, 700);


    } catch (error) {

        console.error(
            "Admin login error:",
            error
        );

        showMessage(
            "Unable to connect to the ResQ server. Make sure the backend is running.",
            "error"
        );

    } finally {

        setLoading(button, false);
    }
}


function setLoading(button, loading) {

    if (!button) {
        return;
    }


    if (loading) {

        button.disabled = true;

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            "Signing in...";

    } else {

        button.disabled = false;

        button.textContent =
            button.dataset.originalText ||
            "Access Admin Panel";
    }
}


function showMessage(text, type) {

    const message =
        document.getElementById(
            "adminLoginMessage"
        );

    if (!message) {
        return;
    }


    message.textContent = text;

    message.className =
        `admin-login-message ${type}`;

    message.style.display =
        "block";
}


function clearMessage() {

    const message =
        document.getElementById(
            "adminLoginMessage"
        );

    if (!message) {
        return;
    }


    message.textContent = "";

    message.className =
        "admin-login-message";

    message.style.display =
        "none";
}


function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}