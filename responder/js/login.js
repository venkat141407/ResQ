const API_URL = "/api";


// ==========================================
// PAGE INITIALIZATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("responderLoginForm");

    if (!form) {
        console.error("Responder login form not found.");
        return;
    }

    form.addEventListener("submit", handleResponderLogin);

});


// ==========================================
// RESPONDER LOGIN
// ==========================================

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


    // ==========================================
    // VALIDATION
    // ==========================================

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


    // ==========================================
    // SHOW LOADING
    // ==========================================

    setLoading(submitButton, true);


    try {

        // ==========================================
        // SEND LOGIN REQUEST
        // ==========================================

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


        // ==========================================
        // SERVER ERROR
        // ==========================================

        if (!response.ok) {

            showMessage(
                data.message ||
                "Invalid email or password.",
                "error"
            );

            return;
        }


        // ==========================================
        // INVALID RESPONSE
        // ==========================================

        if (
            !data.success ||
            !data.token ||
            !data.user
        ) {

            showMessage(
                data.message ||
                "Responder login failed.",
                "error"
            );

            return;
        }


        // ==========================================
        // CHECK USER ROLE
        // ==========================================

        if (data.user.role !== "helper") {

            showMessage(
                "This account is not registered as a responder. Please use the responder registration page.",
                "error"
            );

            return;
        }


        // ==========================================
        // SAVE LOGIN SESSION
        // ==========================================

        localStorage.setItem(
            "resqToken",
            data.token
        );

        localStorage.setItem(
            "resqUser",
            JSON.stringify(data.user)
        );


        // ==========================================
        // LOGIN SUCCESS
        // ==========================================

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

        setLoading(
            submitButton,
            false
        );

    }

}


// ==========================================
// EMAIL VALIDATION
// ==========================================

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}


// ==========================================
// SHOW MESSAGE
// ==========================================

function showMessage(message, type) {

    const element =
        document.getElementById(
            "responderLoginMessage"
        );

    if (!element) {
        return;
    }


    element.textContent = message;

    element.className =
        `responder-login-message ${type}`;

}


// ==========================================
// CLEAR MESSAGE
// ==========================================

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

}


// ==========================================
// BUTTON LOADING STATE
// ==========================================

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


        if (button.dataset.originalText) {

            button.textContent =
                button.dataset.originalText;

        }

    }

}