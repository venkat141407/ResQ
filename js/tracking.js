const API_URL = "/api";

const token = localStorage.getItem("resqToken");
const storedUser = JSON.parse(localStorage.getItem("resqUser") || "null");

if (!token || !storedUser) {
    window.location.href = "login.html";
}

const params = new URLSearchParams(window.location.search);
const emergencyId = params.get("id");

let map = null;
let emergencyMarker = null;
let responderMarker = null;
let pollingTimer = null;
let currentEmergency = null;
let isCancelling = false;

const statusSteps = [
    "pending",
    "matched",
    "accepted",
    "in_progress",
    "resolved"
];

document.addEventListener("DOMContentLoaded", () => {
    setupPage();
});

async function setupPage() {
    if (!emergencyId) {
        showTrackingError("No emergency ID was provided.");
        return;
    }

    setupButtons();
    await loadTracking();

    pollingTimer = setInterval(loadTracking, 5000);
}

function setupButtons() {
    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            clearSession();
        });
    }

    const cancelButtons = [
        document.getElementById("cancelEmergencyBtn"),
        document.getElementById("cancelEmergencyBtnBottom")
    ];

    cancelButtons.forEach(button => {
        if (button) {
            button.addEventListener("click", cancelEmergency);
        }
    });

    const mapButtons = [
        document.getElementById("openMapBtn"),
        document.getElementById("openMapBtnBottom")
    ];

    mapButtons.forEach(button => {
        if (button) {
            button.addEventListener("click", openGoogleMaps);
        }
    });
}

async function loadTracking() {
    try {
        const response = await fetch(
            `${API_URL}/emergencies/${emergencyId}/tracking`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                clearSession();
                return;
            }

            if (response.status === 404) {
                showTrackingError("Emergency not found.");
                stopPolling();
                return;
            }

            if (response.status === 403) {
                showTrackingError(
                    "You are not authorized to view this emergency."
                );
                stopPolling();
                return;
            }

            throw new Error(
                data.message || "Unable to load emergency tracking."
            );
        }

        if (!data.success || !data.emergency) {
            throw new Error(
                data.message || "Tracking information unavailable."
            );
        }

        currentEmergency = data.emergency;

        renderEmergency(data.emergency);
        renderStatus(data.emergency);
        renderResponder(data.emergency);
        updateMap(data.emergency);
        updateCancelButton(data.emergency);

    } catch (error) {
        console.error("Tracking error:", error);

        const errorMessage =
            document.getElementById("trackingError");

        if (errorMessage) {
            errorMessage.textContent =
                error.message ||
                "Unable to update tracking information.";
            errorMessage.style.display = "block";
        }
    }
}

function renderEmergency(emergency) {
    const typeElement =
        document.getElementById("emergencyType");

    const descriptionElement =
        document.getElementById("emergencyDescription");

    const priorityElement =
        document.getElementById("emergencyPriority");

    const timeElement =
        document.getElementById("emergencyCreatedAt");

    if (typeElement) {
        typeElement.textContent =
            formatType(emergency.type);
    }

    if (descriptionElement) {
        descriptionElement.textContent =
            emergency.description || "No description provided.";
    }

    if (priorityElement) {
        priorityElement.textContent =
            formatType(emergency.priority);

        priorityElement.className =
            `priority-badge priority-${emergency.priority}`;
    }

    if (timeElement && emergency.createdAt) {
        timeElement.textContent =
            formatDate(emergency.createdAt);
    }
}

function renderStatus(emergency) {
    const status = emergency.status || "pending";

    const statusElement =
        document.getElementById("liveStatus");

    const statusText =
        document.getElementById("statusText");

    const statusMessage =
        document.getElementById("statusMessage");

    if (statusElement) {
        statusElement.textContent =
            formatStatus(status);
    }

    if (statusText) {
        statusText.textContent =
            formatStatus(status);
    }

    if (statusMessage) {
        statusMessage.textContent =
            getStatusMessage(status);
    }

    updateProgress(status);
}

function updateProgress(status) {
    const currentIndex =
        statusSteps.indexOf(status);

    const progressItems =
        document.querySelectorAll(".tracking-step");

    progressItems.forEach((item, index) => {
        item.classList.remove(
            "completed",
            "active"
        );

        if (currentIndex === -1) {
            return;
        }

        if (index < currentIndex) {
            item.classList.add("completed");
        }

        if (index === currentIndex) {
            item.classList.add("active");
        }
    });

    const progressLine =
        document.getElementById("trackingProgress");

    if (progressLine && currentIndex >= 0) {
        const percentage =
            (currentIndex /
                (statusSteps.length - 1)) *
            100;

        progressLine.style.width =
            `${percentage}%`;
    }
}

function renderResponder(emergency) {
    const responderSection =
        document.getElementById("responderSection");

    const responderName =
        document.getElementById("responderName");

    const responderPhone =
        document.getElementById("responderPhone");

    const responderStatus =
        document.getElementById("responderStatus");

    const responderRating =
        document.getElementById("responderRating");

    const responderLocationTime =
        document.getElementById("responderLocationTime");

    const responder =
        emergency.responder;

    if (!responder) {
        if (responderSection) {
            responderSection.style.display = "none";
        }

        return;
    }

    if (responderSection) {
        responderSection.style.display = "block";
    }

    if (responderName) {
        responderName.textContent =
            responder.name || "Verified Responder";
    }

    if (responderPhone) {
        responderPhone.textContent =
            responder.phone || "Phone unavailable";

        responderPhone.href =
            responder.phone
                ? `tel:${responder.phone}`
                : "#";
    }

    if (responderStatus) {
        responderStatus.textContent =
            responder.availability
                ? "Responder is available"
                : "Responder is currently assisting";
    }

    if (responderRating) {
        responderRating.textContent =
            `${Number(responder.rating || 5).toFixed(1)} ⭐`;
    }

    if (responderLocationTime) {
        if (responder.locationUpdatedAt) {
            const updatedAt =
                new Date(responder.locationUpdatedAt);

            const age =
                Date.now() - updatedAt.getTime();

            const fiveMinutes =
                5 * 60 * 1000;

            if (age > fiveMinutes) {
                responderLocationTime.textContent =
                    "Location was last updated more than 5 minutes ago.";
            } else {
                responderLocationTime.textContent =
                    `Location updated ${formatRelativeTime(
                        responder.locationUpdatedAt
                    )}.`;
            }
        } else {
            responderLocationTime.textContent =
                "Responder location is not available yet.";
        }
    }
}

function updateMap(emergency) {
    const mapElement =
        document.getElementById("resqMap");

    if (!mapElement) {
        return;
    }

    const location =
        emergency.location;

    if (
        !location ||
        !Number.isFinite(Number(location.latitude)) ||
        !Number.isFinite(Number(location.longitude))
    ) {
        return;
    }

    const latitude =
        Number(location.latitude);

    const longitude =
        Number(location.longitude);

    if (!map) {
        map = L.map("resqMap").setView(
            [latitude, longitude],
            15
        );

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution:
                    "&copy; OpenStreetMap contributors"
            }
        ).addTo(map);

        emergencyMarker =
            L.marker([
                latitude,
                longitude
            ])
            .addTo(map)
            .bindPopup(
                "<strong>Emergency Location</strong>"
            )
            .openPopup();
    } else {
        emergencyMarker.setLatLng([
            latitude,
            longitude
        ]);
    }

    updateResponderMarker(emergency);
}

function updateResponderMarker(emergency) {
    if (!map || !emergency.responder) {
        return;
    }

    const responder =
        emergency.responder;

    if (
        !responder.location ||
        !Number.isFinite(
            Number(responder.location.latitude)
        ) ||
        !Number.isFinite(
            Number(responder.location.longitude)
        )
    ) {
        return;
    }

    const latitude =
        Number(responder.location.latitude);

    const longitude =
        Number(responder.location.longitude);

    const responderIcon =
        L.divIcon({
            className: "resq-responder-marker",
            html: "🚑",
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });

    if (!responderMarker) {
        responderMarker =
            L.marker(
                [latitude, longitude],
                {
                    icon: responderIcon
                }
            )
            .addTo(map)
            .bindPopup(
                `<strong>${escapeHtml(
                    responder.name ||
                    "Responder"
                )}</strong><br>Responder location`
            );
    } else {
        responderMarker.setLatLng([
            latitude,
            longitude
        ]);
    }
}

function updateCancelButton(emergency) {
    const buttons = [
        document.getElementById("cancelEmergencyBtn"),
        document.getElementById("cancelEmergencyBtnBottom")
    ];

    const canCancel =
        ![
            "resolved",
            "cancelled"
        ].includes(emergency.status);

    buttons.forEach(button => {
        if (button) {
            button.style.display =
                canCancel ? "inline-flex" : "none";

            button.disabled =
                isCancelling;
        }
    });
}

async function cancelEmergency() {
    if (
        !currentEmergency ||
        isCancelling
    ) {
        return;
    }

    if (
        [
            "resolved",
            "cancelled"
        ].includes(currentEmergency.status)
    ) {
        return;
    }

    const confirmed =
        window.confirm(
            "Are you sure you want to cancel this emergency request?"
        );

    if (!confirmed) {
        return;
    }

    isCancelling = true;
    updateCancelButton(currentEmergency);

    try {
        const response = await fetch(
            `${API_URL}/emergencies/${emergencyId}/cancel`,
            {
                method: "PUT",
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Unable to cancel emergency."
            );
        }

        await loadTracking();

    } catch (error) {
        console.error(
            "Cancel emergency error:",
            error
        );

        alert(
            error.message ||
            "Unable to cancel emergency."
        );
    } finally {
        isCancelling = false;

        if (currentEmergency) {
            updateCancelButton(
                currentEmergency
            );
        }
    }
}

function openGoogleMaps() {
    if (
        !currentEmergency ||
        !currentEmergency.location
    ) {
        return;
    }

    const latitude =
        Number(
            currentEmergency.location.latitude
        );

    const longitude =
        Number(
            currentEmergency.location.longitude
        );

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {
        return;
    }

    const mapsUrl =
        `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    window.open(
        mapsUrl,
        "_blank",
        "noopener,noreferrer"
    );
}

function getStatusMessage(status) {
    const messages = {
        pending:
            "Your emergency request has been received. We are looking for suitable assistance nearby.",

        matched:
            "A nearby responder has been matched to your emergency.",

        accepted:
            "Your responder has accepted the request and is preparing to assist you.",

        in_progress:
            "Your responder is currently assisting you.",

        resolved:
            "This emergency has been marked as resolved. We hope you are safe.",

        cancelled:
            "This emergency request has been cancelled."
    };

    return (
        messages[status] ||
        "Your emergency request is being processed."
    );
}

function formatStatus(status) {
    const labels = {
        pending: "Waiting for responder",
        matched: "Responder matched",
        accepted: "Responder accepted",
        in_progress: "Help in progress",
        resolved: "Emergency resolved",
        cancelled: "Emergency cancelled"
    };

    return (
        labels[status] ||
        formatType(status)
    );
}

function formatType(value) {
    if (!value) {
        return "Unknown";
    }

    return value
        .replace(/_/g, " ")
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );
}

function formatDate(date) {
    try {
        return new Date(date).toLocaleString(
            "en-IN",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );
    } catch {
        return "Unknown";
    }
}

function formatRelativeTime(date) {
    const timestamp =
        new Date(date).getTime();

    const difference =
        Date.now() - timestamp;

    if (difference < 60000) {
        return "just now";
    }

    const minutes =
        Math.floor(difference / 60000);

    if (minutes < 60) {
        return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }

    const hours =
        Math.floor(minutes / 60);

    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
}

function showTrackingError(message) {
    const errorElement =
        document.getElementById("trackingError");

    if (errorElement) {
        errorElement.textContent =
            message;

        errorElement.style.display =
            "block";
    } else {
        alert(message);
    }
}

function stopPolling() {
    if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
    }
}

function clearSession() {
    stopPolling();

    localStorage.removeItem("resqToken");
    localStorage.removeItem("resqUser");

    window.location.href =
        "login.html";
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

window.addEventListener(
    "beforeunload",
    stopPolling
);