const API_URL = "/api";

const token =
    localStorage.getItem("resqToken");

const storedUser =
    JSON.parse(
        localStorage.getItem("resqUser") || "null"
    );

if (!token || !storedUser) {
    window.location.href = "login.html";
}

let activeEmergency = null;
let isSubmitting = false;

document.addEventListener(
    "DOMContentLoaded",
    () => {
        initializeHelpPage();
    }
);

async function initializeHelpPage() {

    setupLogout();

    await loadNotificationCount();

    await loadActiveEmergency();

    setupHelpForm();

    setInterval(
        loadNotificationCount,
        10000
    );
}


function setupLogout() {

    const logoutBtn =
        document.getElementById("logoutBtn");

    if (!logoutBtn) {
        return;
    }

    logoutBtn.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "resqToken"
            );

            localStorage.removeItem(
                "resqUser"
            );

            window.location.href =
                "login.html";
        }
    );
}


async function loadActiveEmergency() {

    try {

        const response =
            await fetch(
                `${API_URL}/emergencies/my`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            if (response.status === 401) {
                clearSession();
                return;
            }

            throw new Error(
                data.message ||
                "Unable to load emergencies."
            );
        }


        const emergencies =
            Array.isArray(data.emergencies)
                ? data.emergencies
                : Array.isArray(data.data)
                    ? data.data
                    : [];


        const activeStatuses = [
            "pending",
            "matched",
            "accepted",
            "in_progress"
        ];


        activeEmergency =
            emergencies
                .filter(
                    emergency =>
                        activeStatuses.includes(
                            emergency.status
                        )
                )
                .sort(
                    (a, b) =>
                        new Date(b.createdAt) -
                        new Date(a.createdAt)
                )[0] || null;


        updateLocationDisplay();

    } catch (error) {

        console.error(
            "Load active emergency error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to load your active emergency.",
            "error"
        );
    }
}


function updateLocationDisplay() {

    const locationText =
        document.getElementById(
            "helpLocationText"
        );

    if (!locationText) {
        return;
    }


    if (!activeEmergency) {

        locationText.textContent =
            "You need an active emergency before requesting additional assistance.";

        return;
    }


    const location =
        activeEmergency.location;

    if (!location) {

        locationText.textContent =
            "Emergency location is unavailable.";

        return;
    }


    const address =
        location.address?.trim();

    if (address) {

        locationText.textContent =
            address;

        return;
    }


    if (
        Number.isFinite(
            Number(location.latitude)
        ) &&
        Number.isFinite(
            Number(location.longitude)
        )
    ) {

        locationText.textContent =
            `Location available • ${
                Number(location.latitude).toFixed(5)
            }, ${
                Number(location.longitude).toFixed(5)
            }`;

        return;
    }


    locationText.textContent =
        "Emergency location is unavailable.";
}


function setupHelpForm() {

    const form =
        document.getElementById(
            "helpRequestForm"
        );

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        handleHelpRequest
    );
}


async function handleHelpRequest(event) {

    event.preventDefault();

    if (isSubmitting) {
        return;
    }


    if (!activeEmergency) {

        showMessage(
            "Please report an emergency first before requesting assistance.",
            "error"
        );

        return;
    }


    const activeStatuses = [
        "pending",
        "matched",
        "accepted",
        "in_progress"
    ];


    if (
        !activeStatuses.includes(
            activeEmergency.status
        )
    ) {

        showMessage(
            "This emergency is no longer active.",
            "error"
        );

        return;
    }


    const selected =
        document.querySelector(
            'input[name="helpType"]:checked'
        );


    if (!selected) {

        showMessage(
            "Please select the type of help you need.",
            "error"
        );

        return;
    }


    const helpType =
        selected.value;


    const validHelpTypes = [
        "first_aid",
        "transport",
        "blood",
        "medicine",
        "shelter",
        "other"
    ];


    if (
        !validHelpTypes.includes(
            helpType
        )
    ) {

        showMessage(
            "Invalid help type selected.",
            "error"
        );

        return;
    }


    isSubmitting = true;

    setSubmitState(true);

    showMatchingState(
        "Searching for a nearby verified responder..."
    );


    try {

        const response =
            await fetch(
                `${API_URL}/emergencies/help-request`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        emergencyId:
                            activeEmergency._id ||
                            activeEmergency.id,

                        helpType
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            if (response.status === 401) {
                clearSession();
                return;
            }

            throw new Error(
                data.message ||
                "Unable to create help request."
            );
        }


        if (!data.success) {

            throw new Error(
                data.message ||
                "Help request could not be created."
            );
        }


        const emergencyId =
            activeEmergency._id ||
            activeEmergency.id;


        if (data.helper || data.matchedHelper) {

            showMatchingState(
                "A nearby responder has been matched. Opening live tracking..."
            );

        } else {

            showMatchingState(
                "Your request has been received. Waiting for a suitable responder..."
            );
        }


        setTimeout(
            () => {

                window.location.href =
                    `tracking.html?id=${encodeURIComponent(
                        emergencyId
                    )}`;

            },
            900
        );


    } catch (error) {

        console.error(
            "Help request error:",
            error
        );

        hideMatchingState();

        showMessage(
            error.message ||
            "Unable to request help.",
            "error"
        );

    } finally {

        isSubmitting = false;

        setSubmitState(false);
    }
}


function setSubmitState(isLoading) {

    const button =
        document.getElementById(
            "helpSubmitBtn"
        );

    if (!button) {
        return;
    }


    button.disabled =
        isLoading;


    if (isLoading) {

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            "Finding Help...";

    } else {

        button.textContent =
            button.dataset.originalText ||
            "Find Nearby Help →";
    }
}


function showMatchingState(message) {

    const section =
        document.getElementById(
            "matchingSection"
        );

    const messageElement =
        document.getElementById(
            "matchingMessage"
        );


    if (messageElement) {

        messageElement.textContent =
            message;
    }


    if (section) {

        section.style.display =
            "block";

        section.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}


function hideMatchingState() {

    const section =
        document.getElementById(
            "matchingSection"
        );

    if (section) {

        section.style.display =
            "none";
    }
}


function showMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "helpMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;

    element.className =
        `profile-message ${type}`;

    element.style.display =
        "block";


    clearTimeout(
        showMessage.timer
    );


    showMessage.timer =
        setTimeout(
            () => {

                element.style.display =
                    "none";

            },
            6000
        );
}


async function loadNotificationCount() {

    try {

        const response =
            await fetch(
                `${API_URL}/notifications/unread-count`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        if (!response.ok) {
            return;
        }


        const data =
            await response.json();


        const count =
            Number(
                data.unreadCount ??
                data.count ??
                0
            );


        const badge =
            document.getElementById(
                "notificationNavCount"
            );


        if (!badge) {
            return;
        }


        badge.textContent =
            count > 99
                ? "99+"
                : count;


        badge.style.display =
            count > 0
                ? "inline-flex"
                : "none";


    } catch (error) {

        console.error(
            "Notification count error:",
            error
        );
    }
}


function clearSession() {

    localStorage.removeItem(
        "resqToken"
    );

    localStorage.removeItem(
        "resqUser"
    );

    window.location.href =
        "login.html";
}