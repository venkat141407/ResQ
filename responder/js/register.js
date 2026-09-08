const API_URL = "/api";

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("responderRegisterForm");

    if (!form) {
        console.error("Responder registration form not found.");
        return;
    }

    form.addEventListener("submit", registerResponder);

});


async function registerResponder(event) {

    event.preventDefault();

    const name =
        document.getElementById("responderName").value.trim();

    const email =
        document.getElementById("responderEmail").value.trim().toLowerCase();

    const phone =
        document.getElementById("responderPhone").value.trim();

    const password =
        document.getElementById("responderPassword").value;

    const confirmPassword =
        document.getElementById("responderConfirmPassword").value;

    const message =
        document.getElementById("responderRegisterMessage");

    const button =
        document.querySelector(
            "#responderRegisterForm button[type='submit']"
        );


    clearMessage();


    // -----------------------------
    // BASIC VALIDATION
    // -----------------------------

    if (!name || !email || !phone || !password || !confirmPassword) {

        showMessage(
            "Please fill in all required fields.",
            "error"
        );

        return;
    }


    if (name.length < 2) {

        showMessage(
            "Name must contain at least 2 characters.",
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


    if (password.length < 6) {

        showMessage(
            "Password must contain at least 6 characters.",
            "error"
        );

        return;
    }


    if (password !== confirmPassword) {

        showMessage(
            "Passwords do not match.",
            "error"
        );

        return;
    }


    // -----------------------------
    // HELP TYPES
    // -----------------------------

    const helpTypes = Array.from(
        document.querySelectorAll(
            'input[name="helpType"]:checked'
        )
    ).map(input => input.value);


    if (helpTypes.length === 0) {

        showMessage(
            "Please select at least one type of assistance you can provide.",
            "error"
        );

        return;
    }


    // -----------------------------
    // LOADING
    // -----------------------------

    setLoading(button, true);


    try {

        // Ask for location during registration

        let latitude = null;
        let longitude = null;


        if (navigator.geolocation) {

            try {

                const position =
                    await getCurrentLocation();

                latitude =
                    position.coords.latitude;

                longitude =
                    position.coords.longitude;

            } catch (locationError) {

                console.warn(
                    "Location unavailable during registration:",
                    locationError
                );

            }

        }


        // -----------------------------
        // REGISTER RESPONDER
        // -----------------------------

        const response = await fetch(
            `${API_URL}/helpers/register`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    name,
                    email,
                    phone,
                    password,

                    helpTypes,

                    latitude,
                    longitude

                })
            }
        );


        const data =
            await response.json();


        // -----------------------------
        // SERVER ERROR
        // -----------------------------

        if (!response.ok) {

            showMessage(
                data.message ||
                "Responder registration failed.",
                "error"
            );

            return;
        }


        if (!data.success) {

            showMessage(
                data.message ||
                "Responder registration failed.",
                "error"
            );

            return;
        }


        // -----------------------------
        // SUCCESS
        // -----------------------------

        showMessage(
            "Responder account created successfully. Your account is now waiting for admin verification.",
            "success"
        );


        document
            .getElementById("responderRegisterForm")
            .reset();


        setTimeout(() => {

            window.location.href =
                "/responder/login.html";

        }, 2000);


    } catch (error) {

        console.error(
            "Responder registration error:",
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


// ==========================================
// LOCATION
// ==========================================

function getCurrentLocation() {

    return new Promise((resolve, reject) => {

        navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );

    });

}


// ==========================================
// EMAIL VALIDATION
// ==========================================

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}


// ==========================================
// MESSAGE
// ==========================================

function showMessage(message, type) {

    const element =
        document.getElementById(
            "responderRegisterMessage"
        );

    if (!element) return;

    element.textContent =
        message;

    element.className =
        `responder-login-message ${type}`;

}


// ==========================================
// CLEAR MESSAGE
// ==========================================

function clearMessage() {

    const element =
        document.getElementById(
            "responderRegisterMessage"
        );

    if (!element) return;

    element.textContent = "";

    element.className =
        "responder-login-message";

}


// ==========================================
// BUTTON LOADING
// ==========================================

function setLoading(button, loading) {

    if (!button) return;


    if (loading) {

        button.disabled = true;

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            "Creating Account...";

    } else {

        button.disabled = false;

        if (button.dataset.originalText) {

            button.textContent =
                button.dataset.originalText;

        }

    }

}