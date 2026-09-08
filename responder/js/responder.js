const API_URL = "/api";

const token = localStorage.getItem("resqToken");
const userData = localStorage.getItem("resqUser");


// ============================================================
// AUTHENTICATION
// ============================================================

if (!token || !userData) {
    window.location.href = "login.html";
}

let user;

try {
    user = JSON.parse(userData);
} catch (error) {
    localStorage.removeItem("resqToken");
    localStorage.removeItem("resqUser");
    window.location.href = "login.html";
}

if (!user || user.role !== "helper") {
    localStorage.removeItem("resqToken");
    localStorage.removeItem("resqUser");
    window.location.href = "login.html";
}


// ============================================================
// ELEMENTS
// ============================================================

const availabilityText =
    document.getElementById("availabilityText");

const availabilityDot =
    document.querySelector(".availability-dot");

const activeRequestsElement =
    document.getElementById("activeRequests");

const completedRequestsElement =
    document.getElementById("completedRequests");

const responderRatingElement =
    document.getElementById("responderRating");

const responderEmergencyList =
    document.getElementById("responderEmergencyList");

const notificationNavCount =
    document.getElementById("notificationNavCount");

const logoutButton =
    document.getElementById("responderLogout");


// ============================================================
// STATE
// ============================================================

let helperProfile = null;
let currentRequests = [];

let locationWatchId = null;
let locationSending = false;

let selectedEmergency = null;


// ============================================================
// API HELPER
// ============================================================

async function apiRequest(
    url,
    options = {}
) {
    const requestOptions = {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
            "Authorization": `Bearer ${token}`
        }
    };

    const response =
        await fetch(
            `${API_URL}${url}`,
            requestOptions
        );

    let data = {};

    try {
        data = await response.json();
    } catch (error) {
        data = {
            success: false,
            message: "Invalid server response"
        };
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Request failed"
        );
    }

    return data;
}


// ============================================================
// LOAD HELPER PROFILE
// ============================================================

async function loadHelperProfile() {

    try {

        const data =
            await apiRequest(
                "/helpers/profile"
            );

        if (!data.success) {
            throw new Error(
                data.message ||
                "Unable to load responder profile"
            );
        }

        helperProfile =
            data.helper ||
            data.profile ||
            null;

        if (!helperProfile) {
            showDashboardMessage(
                "Unable to load responder profile."
            );

            return;
        }

        updateProfileStats();

        updateAvailabilityUI();

        handleLocationTracking();

    } catch (error) {

        console.error(
            "Helper profile error:",
            error
        );

        showDashboardMessage(
            error.message ||
            "Unable to load responder profile."
        );
    }
}


// ============================================================
// UPDATE PROFILE STATS
// ============================================================

function updateProfileStats() {

    if (!helperProfile) {
        return;
    }

    if (completedRequestsElement) {

        completedRequestsElement.textContent =
            helperProfile.completedRequests || 0;
    }

    if (responderRatingElement) {

        const rating =
            Number(
                helperProfile.rating || 5
            ).toFixed(1);

        responderRatingElement.textContent =
            `${rating} ⭐`;
    }
}


// ============================================================
// AVAILABILITY UI
// ============================================================

function updateAvailabilityUI() {

    if (!helperProfile) {
        return;
    }

    const available =
        Boolean(
            helperProfile.isAvailable
        );

    if (availabilityText) {

        availabilityText.textContent =
            available
                ? "Available"
                : "Unavailable";
    }

    if (availabilityDot) {

        availabilityDot.classList.toggle(
            "offline",
            !available
        );
    }
}


// ============================================================
// LOCATION TRACKING
// ============================================================

function handleLocationTracking() {

    if (
        !helperProfile ||
        helperProfile.verificationStatus !== "verified"
    ) {
        stopLocationTracking();
        return;
    }

    if (helperProfile.isAvailable) {
        startLocationTracking();
    } else {
        stopLocationTracking();
    }
}


function startLocationTracking() {

    if (locationWatchId !== null) {
        return;
    }

    if (!navigator.geolocation) {
        console.warn(
            "Geolocation is not supported."
        );
        return;
    }

    locationWatchId =
        navigator.geolocation.watchPosition(
            sendCurrentLocation,
            locationError,
            {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 15000
            }
        );
}


function stopLocationTracking() {

    if (locationWatchId !== null) {

        navigator.geolocation.clearWatch(
            locationWatchId
        );

        locationWatchId = null;
    }
}


async function sendCurrentLocation(position) {

    if (locationSending) {
        return;
    }

    if (
        !helperProfile ||
        !helperProfile.isAvailable
    ) {
        return;
    }

    const latitude =
        Number(
            position.coords.latitude
        );

    const longitude =
        Number(
            position.coords.longitude
        );

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {
        return;
    }

    locationSending = true;

    try {

        await apiRequest(
            "/helpers/location",
            {
                method: "PUT",

                body: JSON.stringify({
                    latitude,
                    longitude
                })
            }
        );

        if (helperProfile.location) {

            helperProfile.location.latitude =
                latitude;

            helperProfile.location.longitude =
                longitude;
        }

        helperProfile.lastLocationUpdate =
            new Date().toISOString();

    } catch (error) {

        console.error(
            "Location update error:",
            error
        );

    } finally {

        locationSending = false;
    }
}


function locationError(error) {

    console.warn(
        "Location error:",
        error.message
    );
}


// ============================================================
// LOAD EMERGENCY REQUESTS
// ============================================================

async function loadRequests() {

    if (!responderEmergencyList) {
        return;
    }

    try {

        const data =
            await apiRequest(
                "/helpers/requests"
            );

        if (!data.success) {

            throw new Error(
                data.message ||
                "Unable to load requests"
            );
        }

        currentRequests =
            data.requests ||
            data.emergencies ||
            [];

        renderRequests(
            currentRequests
        );

        updateRequestStats(
            currentRequests
        );

        updateHighlightedEmergency();

    } catch (error) {

        console.error(
            "Load requests error:",
            error
        );

        responderEmergencyList.innerHTML = `
            <div class="responder-empty-card">
                <div>⚠️</div>
                <h3>Unable to load requests</h3>
                <p>${escapeHtml(
                    error.message ||
                    "Please try again later."
                )}</p>
            </div>
        `;
    }
}


// ============================================================
// REQUEST STATS
// ============================================================

function updateRequestStats(
    requests
) {

    const active =
        requests.filter(
            request => {

                const status =
                    request.status ||
                    request.emergency?.status;

                return [
                    "requested",
                    "matched",
                    "accepted",
                    "in_progress"
                ].includes(status);
            }
        ).length;

    const completed =
        requests.filter(
            request => {

                const status =
                    request.status ||
                    request.emergency?.status;

                return (
                    status === "completed" ||
                    status === "resolved"
                );
            }
        ).length;

    if (activeRequestsElement) {
        activeRequestsElement.textContent =
            active;
    }

    if (completedRequestsElement) {

        const profileCompleted =
            Number(
                helperProfile?.completedRequests ||
                0
            );

        completedRequestsElement.textContent =
            Math.max(
                profileCompleted,
                completed
            );
    }
}


// ============================================================
// RENDER REQUESTS
// ============================================================

function renderRequests(
    requests
) {

    if (!responderEmergencyList) {
        return;
    }

    if (!requests.length) {

        responderEmergencyList.innerHTML = `
            <div class="responder-empty-card">
                <div>🆘</div>
                <h3>No active requests</h3>
                <p>
                    New emergency requests matching
                    your assistance type will appear here.
                </p>
            </div>
        `;

        return;
    }

    const sortedRequests =
        [...requests].sort(
            (a, b) => {

                const priorityOrder = {
                    critical: 1,
                    high: 2,
                    medium: 3,
                    low: 4
                };

                const aPriority =
                    priorityOrder[
                        a.emergency?.priority ||
                        a.priority ||
                        "medium"
                    ] || 5;

                const bPriority =
                    priorityOrder[
                        b.emergency?.priority ||
                        b.priority ||
                        "medium"
                    ] || 5;

                if (
                    aPriority !==
                    bPriority
                ) {
                    return (
                        aPriority -
                        bPriority
                    );
                }

                return (
                    new Date(
                        b.createdAt ||
                        b.emergency?.createdAt ||
                        0
                    ) -
                    new Date(
                        a.createdAt ||
                        a.emergency?.createdAt ||
                        0
                    )
                );
            }
        );

    responderEmergencyList.innerHTML = "";

    sortedRequests.forEach(
        request => {

            const card =
                createRequestCard(
                    request
                );

            responderEmergencyList.appendChild(
                card
            );
        }
    );
}


// ============================================================
// REQUEST CARD
// ============================================================

function createRequestCard(
    request
) {

    const card =
        document.createElement("article");

    card.className =
        "responder-emergency-card";

    const emergency =
        request.emergency ||
        request;

    const status =
        request.status ||
        emergency.status ||
        "requested";

    const priority =
        emergency.priority ||
        "high";

    const type =
        emergency.type ||
        "other";

    const description =
        emergency.description ||
        "Emergency assistance requested.";

    const helpType =
        request.helpType ||
        "other";

    const distance =
        request.distance !== null &&
        request.distance !== undefined
            ? `${Number(
                request.distance
              ).toFixed(2)} km away`
            : "Nearby";

    const createdAt =
        request.createdAt ||
        emergency.createdAt;

    const timeText =
        createdAt
            ? formatDate(createdAt)
            : "Recently";

    const requester =
        request.requester ||
        emergency.user ||
        null;

    const requesterName =
        requester?.name ||
        "ResQ User";

    const statusLabel =
        formatStatus(status);

    const priorityLabel =
        priority.toUpperCase();

    card.innerHTML = `
        <div class="responder-card-top">

            <div>
                <span class="responder-request-type">
                    ${escapeHtml(
                        type.replace(
                            /_/g,
                            " "
                        ).toUpperCase()
                    )}
                </span>

                <h3>
                    ${escapeHtml(
                        description
                    )}
                </h3>
            </div>

            <span class="responder-status-badge ${escapeHtml(
                status
            )}">
                ${escapeHtml(
                    statusLabel
                )}
            </span>

        </div>

        <div class="responder-request-meta">

            <div>
                <small>PRIORITY</small>
                <strong>
                    ${escapeHtml(
                        priorityLabel
                    )}
                </strong>
            </div>

            <div>
                <small>ASSISTANCE</small>
                <strong>
                    ${escapeHtml(
                        helpType.replace(
                            /_/g,
                            " "
                        )
                    )}
                </strong>
            </div>

            <div>
                <small>DISTANCE</small>
                <strong>
                    ${escapeHtml(
                        distance
                    )}
                </strong>
            </div>

            <div>
                <small>REPORTED</small>
                <strong>
                    ${escapeHtml(
                        timeText
                    )}
                </strong>
            </div>

        </div>

        <div class="responder-request-footer">

            <div class="requester-preview">
                <span>👤</span>
                <div>
                    <small>REQUESTER</small>
                    <strong>
                        ${escapeHtml(
                            requesterName
                        )}
                    </strong>
                </div>
            </div>

            <button
                class="responder-action-button"
                data-action="details"
                data-id="${escapeHtml(
                    emergency._id ||
                    emergency.id ||
                    ""
                )}"
            >
                View Details →
            </button>

        </div>
    `;

    return card;
}


// ============================================================
// REQUEST DETAILS MODAL
// ============================================================

function showRequestDetails(
    request
) {

    selectedEmergency =
        request;

    const emergency =
        request.emergency ||
        request;

    const status =
        request.status ||
        emergency.status ||
        "requested";

    const priority =
        emergency.priority ||
        "high";

    const type =
        emergency.type ||
        "other";

    const description =
        emergency.description ||
        "Emergency assistance requested.";

    const helpType =
        request.helpType ||
        "other";

    const requester =
        request.requester ||
        emergency.user ||
        null;

    const latitude =
        emergency.location?.latitude;

    const longitude =
        emergency.location?.longitude;

    const modal =
        document.createElement("div");

    modal.className =
        "responder-modal-overlay";

    modal.id =
        "responderDetailsModal";

    modal.innerHTML = `
        <div class="responder-modal">

            <button
                class="responder-modal-close"
                id="closeResponderModal"
                aria-label="Close"
            >
                ×
            </button>

            <span class="responder-label">
                EMERGENCY DETAILS
            </span>

            <h2>
                ${escapeHtml(
                    type
                        .replace(
                            /_/g,
                            " "
                        )
                        .toUpperCase()
                )}
            </h2>

            <div class="modal-status-row">

                <span class="responder-status-badge ${escapeHtml(
                    status
                )}">
                    ${escapeHtml(
                        formatStatus(
                            status
                        )
                    )}
                </span>

                <span class="modal-priority">
                    ${escapeHtml(
                        priority.toUpperCase()
                    )} PRIORITY
                </span>

            </div>

            <div class="modal-detail-block">
                <small>DESCRIPTION</small>
                <p>
                    ${escapeHtml(
                        description
                    )}
                </p>
            </div>

            <div class="modal-detail-grid">

                <div>
                    <small>ASSISTANCE NEEDED</small>
                    <strong>
                        ${escapeHtml(
                            helpType.replace(
                                /_/g,
                                " "
                            )
                        )}
                    </strong>
                </div>

                <div>
                    <small>DISTANCE</small>
                    <strong>
                        ${
                            request.distance !==
                                null &&
                            request.distance !==
                                undefined
                                ? `${Number(
                                    request.distance
                                  ).toFixed(2)} km`
                                : "Nearby"
                        }
                    </strong>
                </div>

                <div>
                    <small>REQUESTER</small>
                    <strong>
                        ${escapeHtml(
                            requester?.name ||
                            "ResQ User"
                        )}
                    </strong>
                </div>

                <div>
                    <small>REPORTED</small>
                    <strong>
                        ${
                            emergency.createdAt
                                ? escapeHtml(
                                    formatDate(
                                        emergency.createdAt
                                    )
                                )
                                : "Recently"
                        }
                    </strong>
                </div>

            </div>

            <div class="modal-detail-block">
                <small>REQUESTER CONTACT</small>

                <div class="requester-contact">

                    <span>
                        📞
                        ${escapeHtml(
                            requester?.phone ||
                            "Not available"
                        )}
                    </span>

                    <span>
                        ✉️
                        ${escapeHtml(
                            requester?.email ||
                            "Not available"
                        )}
                    </span>

                </div>
            </div>

            <div class="modal-detail-block">
                <small>LOCATION</small>

                <p>
                    ${
                        latitude !==
                            undefined &&
                        longitude !==
                            undefined
                            ? `${Number(
                                latitude
                              ).toFixed(5)},
                               ${Number(
                                longitude
                              ).toFixed(5)}`
                            : "Location unavailable"
                    }
                </p>
            </div>

            <div class="modal-actions">

                ${
                    latitude !==
                        undefined &&
                    longitude !==
                        undefined
                        ? `
                        <a
                            href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                latitude
                            )},${encodeURIComponent(
                                longitude
                            )}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="responder-outline-button"
                        >
                            📍 Navigate
                        </a>
                        `
                        : ""
                }

                ${getModalActionButton(
                    status,
                    emergency._id ||
                        emergency.id
                )}

            </div>

        </div>
    `;

    document.body.appendChild(
        modal
    );

    const closeButton =
        document.getElementById(
            "closeResponderModal"
        );

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeRequestModal
        );
    }

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modal
            ) {
                closeRequestModal();
            }
        }
    );

    document.addEventListener(
        "keydown",
        handleModalEscape
    );
}


// ============================================================
// MODAL ACTION BUTTON
// ============================================================

function getModalActionButton(
    status,
    emergencyId
) {

    if (!emergencyId) {
        return "";
    }

    if (
        status === "requested" ||
        status === "matched"
    ) {

        return `
            <button
                class="responder-primary-button"
                data-modal-action="accept"
                data-id="${escapeHtml(
                    emergencyId
                )}"
            >
                ✓ Accept Emergency
            </button>
        `;
    }

    if (status === "accepted") {

        return `
            <button
                class="responder-primary-button"
                data-modal-action="start"
                data-id="${escapeHtml(
                    emergencyId
                )}"
            >
                🚑 Start Response
            </button>
        `;
    }

    if (status === "in_progress") {

        return `
            <button
                class="responder-primary-button"
                data-modal-action="resolve"
                data-id="${escapeHtml(
                    emergencyId
                )}"
            >
                ✓ Mark Resolved
            </button>
        `;
    }

    return "";
}


// ============================================================
// CLOSE MODAL
// ============================================================

function closeRequestModal() {

    const modal =
        document.getElementById(
            "responderDetailsModal"
        );

    if (modal) {
        modal.remove();
    }

    document.removeEventListener(
        "keydown",
        handleModalEscape
    );

    selectedEmergency = null;
}


function handleModalEscape(
    event
) {

    if (
        event.key === "Escape"
    ) {
        closeRequestModal();
    }
}


// ============================================================
// ACCEPT EMERGENCY
// ============================================================

async function acceptEmergency(
    emergencyId
) {

    if (!emergencyId) {
        return;
    }

    if (
        !helperProfile ||
        helperProfile.verificationStatus !==
            "verified"
    ) {

        showTemporaryMessage(
            "Your responder account must be verified before accepting requests."
        );

        return;
    }

    if (!helperProfile.isAvailable) {

        showTemporaryMessage(
            "Set your responder status to Available before accepting a request."
        );

        return;
    }

    const confirmed =
        window.confirm(
            "Accept this emergency request?"
        );

    if (!confirmed) {
        return;
    }

    try {

        await apiRequest(
            `/helpers/emergency/${encodeURIComponent(
                emergencyId
            )}/accept`,
            {
                method: "PUT"
            }
        );

        closeRequestModal();

        await loadHelperProfile();
        await loadRequests();

        showTemporaryMessage(
            "Emergency accepted successfully."
        );

    } catch (error) {

        console.error(
            "Accept emergency error:",
            error
        );

        showTemporaryMessage(
            error.message ||
            "Unable to accept emergency."
        );
    }
}


// ============================================================
// START RESPONSE
// ============================================================

async function startResponse(
    emergencyId
) {

    if (!emergencyId) {
        return;
    }

    try {

        await apiRequest(
            `/helpers/emergency/${encodeURIComponent(
                emergencyId
            )}/status`,
            {
                method: "PUT",

                body: JSON.stringify({
                    status: "in_progress"
                })
            }
        );

        closeRequestModal();

        await loadHelperProfile();
        await loadRequests();

        showTemporaryMessage(
            "Response started. Your location is now being shared while you are available."
        );

    } catch (error) {

        console.error(
            "Start response error:",
            error
        );

        showTemporaryMessage(
            error.message ||
            "Unable to start response."
        );
    }
}


// ============================================================
// RESOLVE EMERGENCY
// ============================================================

async function resolveEmergency(
    emergencyId
) {

    if (!emergencyId) {
        return;
    }

    const confirmed =
        window.confirm(
            "Mark this emergency as resolved?"
        );

    if (!confirmed) {
        return;
    }

    try {

        await apiRequest(
            `/helpers/emergency/${encodeURIComponent(
                emergencyId
            )}/status`,
            {
                method: "PUT",

                body: JSON.stringify({
                    status: "resolved"
                })
            }
        );

        closeRequestModal();

        await loadHelperProfile();
        await loadRequests();

        showTemporaryMessage(
            "Emergency marked as resolved."
        );

    } catch (error) {

        console.error(
            "Resolve emergency error:",
            error
        );

        showTemporaryMessage(
            error.message ||
            "Unable to resolve emergency."
        );
    }
}


// ============================================================
// AVAILABILITY TOGGLE
// ============================================================

async function toggleAvailability() {

    if (!helperProfile) {
        return;
    }

    if (
        helperProfile.verificationStatus !==
        "verified"
    ) {

        showTemporaryMessage(
            "Your responder account must be verified by an admin before you can become available."
        );

        return;
    }

    const newAvailability =
        !helperProfile.isAvailable;

    try {

        const data =
            await apiRequest(
                "/helpers/availability",
                {
                    method: "PUT",

                    body: JSON.stringify({
                        isAvailable:
                            newAvailability
                    })
                }
            );

        if (!data.success) {

            throw new Error(
                data.message ||
                "Unable to update availability"
            );
        }

        helperProfile.isAvailable =
            Boolean(
                data.helper?.isAvailable ??
                newAvailability
            );

        updateAvailabilityUI();

        handleLocationTracking();

        showTemporaryMessage(
            helperProfile.isAvailable
                ? "You are now available for emergency requests."
                : "You are now unavailable for new requests."
        );

    } catch (error) {

        console.error(
            "Availability error:",
            error
        );

        showTemporaryMessage(
            error.message ||
            "Unable to update availability."
        );
    }
}


// ============================================================
// AVAILABILITY CARD CLICK
// ============================================================

const availabilityCard =
    document.querySelector(
        ".availability-card"
    );

if (availabilityCard) {

    availabilityCard.style.cursor =
        "pointer";

    availabilityCard.title =
        "Click to change availability";

    availabilityCard.addEventListener(
        "click",
        toggleAvailability
    );
}


// ============================================================
// NOTIFICATION COUNT
// ============================================================

async function loadNotificationCount() {

    if (!notificationNavCount) {
        return;
    }

    try {

        const data =
            await apiRequest(
                "/notifications/unread-count"
            );

        if (!data.success) {
            return;
        }

        const count =
            Number(
                data.unreadCount || 0
            );

        notificationNavCount.textContent =
            count;

        notificationNavCount.classList.toggle(
            "has-notifications",
            count > 0
        );

    } catch (error) {

        console.error(
            "Notification count error:",
            error
        );
    }
}


// ============================================================
// HIGHLIGHT EMERGENCY FROM NOTIFICATION
// ============================================================

function updateHighlightedEmergency() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const emergencyId =
        params.get(
            "emergency"
        );

    if (!emergencyId) {
        return;
    }

    const matchingRequest =
        currentRequests.find(
            request => {

                const emergency =
                    request.emergency ||
                    request;

                return (
                    String(
                        emergency._id ||
                        emergency.id
                    ) ===
                    String(
                        emergencyId
                    )
                );
            }
        );

    if (matchingRequest) {

        setTimeout(
            () => {

                showRequestDetails(
                    matchingRequest
                );

            },
            250
        );
    }
}


// ============================================================
// CARD CLICK HANDLER
// ============================================================

if (responderEmergencyList) {

    responderEmergencyList.addEventListener(
        "click",
        event => {

            const detailsButton =
                event.target.closest(
                    '[data-action="details"]'
                );

            if (!detailsButton) {
                return;
            }

            const emergencyId =
                detailsButton.dataset.id;

            const request =
                findRequestByEmergencyId(
                    emergencyId
                );

            if (request) {

                showRequestDetails(
                    request
                );
            }
        }
    );
}


// ============================================================
// MODAL ACTION HANDLER
// ============================================================

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-modal-action]"
            );

        if (!button) {
            return;
        }

        const action =
            button.dataset.modalAction;

        const emergencyId =
            button.dataset.id;

        if (action === "accept") {

            acceptEmergency(
                emergencyId
            );

        } else if (
            action === "start"
        ) {

            startResponse(
                emergencyId
            );

        } else if (
            action === "resolve"
        ) {

            resolveEmergency(
                emergencyId
            );
        }
    }
);


// ============================================================
// FIND REQUEST
// ============================================================

function findRequestByEmergencyId(
    emergencyId
) {

    return currentRequests.find(
        request => {

            const emergency =
                request.emergency ||
                request;

            return (
                String(
                    emergency._id ||
                    emergency.id
                ) ===
                String(
                    emergencyId
                )
            );
        }
    );
}


// ============================================================
// TEMPORARY MESSAGE
// ============================================================

function showTemporaryMessage(
    message
) {

    const existing =
        document.getElementById(
            "responderToast"
        );

    if (existing) {
        existing.remove();
    }

    const toast =
        document.createElement(
            "div"
        );

    toast.id =
        "responderToast";

    toast.className =
        "responder-toast";

    toast.textContent =
        message;

    document.body.appendChild(
        toast
    );

    requestAnimationFrame(
        () => {
            toast.classList.add(
                "show"
            );
        }
    );

    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

            setTimeout(
                () => {
                    toast.remove();
                },
                250
            );

        },
        3500
    );
}


// ============================================================
// DASHBOARD MESSAGE
// ============================================================

function showDashboardMessage(
    message
) {

    if (!responderEmergencyList) {
        return;
    }

    responderEmergencyList.innerHTML = `
        <div class="responder-empty-card">
            <div>⚠️</div>
            <h3>Something went wrong</h3>
            <p>${escapeHtml(
                message
            )}</p>
        </div>
    `;
}


// ============================================================
// LOGOUT
// ============================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        () => {

            stopLocationTracking();

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


// ============================================================
// FORMATTING HELPERS
// ============================================================

function formatStatus(
    status
) {

    return String(
        status || "requested"
    )
        .replace(
            /_/g,
            " "
        )
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );
}


function formatDate(
    date
) {

    try {

        return new Date(
            date
        ).toLocaleString(
            [],
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );

    } catch (error) {

        return "Recently";
    }
}


function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// ============================================================
// INITIAL LOAD
// ============================================================

async function initializeResponderDashboard() {

    await loadHelperProfile();

    await loadRequests();

    await loadNotificationCount();
}


// ============================================================
// POLLING
// ============================================================

const requestPolling =
    setInterval(
        async () => {

            if (
                document.hidden
            ) {
                return;
            }

            await loadRequests();

            await loadNotificationCount();

        },
        10000
    );


// ============================================================
// CLEANUP
// ============================================================

window.addEventListener(
    "beforeunload",
    () => {

        stopLocationTracking();

        clearInterval(
            requestPolling
        );
    }
);


// ============================================================
// START
// ============================================================

initializeResponderDashboard();