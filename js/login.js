const API_URL = "/api";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("responderLoginForm");

    if (!form) {
        console.error("Responder login form not found.");
        return;
    }

    form.addEventListener("submit", handleResponderLogin);
});


async function handleResponderLogin(event) {
    event.preventDefault();

    const emailInput =
        document.getElementById("responderEmail");

    const passwordInput =
        document.getElementById("responderPassword");

    const messageElement =
        document.getElementById("responderLoginMessage");

    const submitButton =
        document.querySelector(
            "#responderLoginForm button[type='submit']"
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


    setLoading(true);


    try {

        const response = await fetch(
            `${API_URL}/auth/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    email,
                    password
                })
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            showMessage(
                data.message ||
                "Invalid email or password.",
                "error"
            );

            return;
        }


        if (!data.success) {

            showMessage(
                data.message ||
                "Login failed.",
                "error"
            );

            return;
        }


        /*
         * IMPORTANT:
         * A responder must have the helper role.
         */

        if (
            !data.user ||
            data.user.role !== "helper"
        ) {

            showMessage(
                "This account is not registered as a responder. Please use the responder registration page.",
                "error"
            );

            return;
        }


        if (!data.token) {

            showMessage(
                "Login succeeded but no authentication token was received.",
                "error"
            );

            return;
        }


        /*
         * Save responder authentication.
         */

        localStorage.setItem(
            "resqToken",
            data.token
        );


        localStorage.setItem(
            "resqUser",
            JSON.stringify(data.user)
        );


        /*
         * Small success message before redirect.
         */

        showMessage(
            "Responder login successful. Opening dashboard...",
            "success"
        );


        setTimeout(() => {

            window.location.href =
                "dashboard.html";

        }, 700);


    } catch (error) {

        console.error(
            "Responder login error:",
            error
        );


        showMessage(
            "Unable to connect to the ResQ server. Make sure the backend is running.",
            "error"
        );

    } finally {

        setLoading(false);
    }
}


function setLoading(isLoading) {

    const button =
        document.querySelector(
            "#responderLoginForm button[type='submit']"
        );


    if (!button) {
        return;
    }


    if (isLoading) {

        button.disabled = true;

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            "Signing in...";

    } else {

        button.disabled = false;

        button.textContent =
            button.dataset.originalText ||
            "Login as Responder";
    }
}


function showMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "responderLoginMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        `responder-login-message ${type}`;


    element.style.display =
        "block";
}


function clearMessage() {

    const element =
        document.getElementById(
            "responderLoginMessage"
        );


    if (!element) {
        return;
    }


    element.textContent = "";

    element.className =
        "responder-login-message";

    element.style.display =
        "none";
}


function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);
}