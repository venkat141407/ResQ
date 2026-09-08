const API_URL = "/api";


/* =========================================================
   RESQ ADMIN - COMMON FUNCTIONS
========================================================= */

function getToken() {
    return localStorage.getItem("resqToken");
}


function getUser() {

    const value =
        localStorage.getItem("resqUser");

    if (!value) {
        return null;
    }

    try {
        return JSON.parse(value);
    } catch (error) {
        console.error(
            "Unable to read admin user:",
            error
        );

        return null;
    }
}


/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

function requireAdmin() {

    const token =
        getToken();

    const user =
        getUser();


    if (!token || !user) {

        window.location.href =
            "login.html";

        return false;
    }


    if (user.role !== "admin") {

        window.location.href =
            "../frontend/dashboard.html";

        return false;
    }


    return true;
}


function logoutAdmin() {

    localStorage.removeItem(
        "resqToken"
    );

    localStorage.removeItem(
        "resqUser"
    );


    window.location.href =
        "login.html";
}


/* =========================================================
   TEXT HELPERS
========================================================= */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatText(value) {

    if (!value) {
        return "—";
    }


    return String(value)
        .replace(/_/g, " ")
        .replace(/\b\w/g, letter =>
            letter.toUpperCase()
        );
}


function formatDate(value) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "—";
    }


    return date.toLocaleString();
}


/* =========================================================
   ELEMENT FINDER
   Supports current and older HTML IDs.
========================================================= */

function findElement(
    ids = []
) {

    for (
        const id of ids
    ) {

        const element =
            document.getElementById(id);


        if (element) {
            return element;
        }
    }


    return null;
}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(
    endpoint,
    options = {}
) {

    const token =
        getToken();


    const headers = {
        "Content-Type":
            "application/json",
        ...(options.headers || {})
    };


    if (token) {

        headers.Authorization =
            `Bearer ${token}`;
    }


    try {

        const response =
            await fetch(
                `${API_URL}${endpoint}`,
                {
                    ...options,
                    headers
                }
            );


        let data;


        try {

            data =
                await response.json();

        } catch (error) {

            data = {
                success: false,
                message:
                    "Server returned an invalid response."
            };
        }


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            const user =
                getUser();


            if (
                !user ||
                user.role !== "admin"
            ) {

                logoutAdmin();

                return {
                    success: false,
                    message:
                        "Admin authentication expired."
                };
            }
        }


        return data;


    } catch (error) {

        console.error(
            `API error: ${endpoint}`,
            error
        );


        return {
            success: false,
            message:
                "Unable to connect to ResQ server."
        };
    }
}


/* =========================================================
   GLOBAL DATA
========================================================= */

let adminUsers = [];
let adminHelpers = [];
let adminEmergencies = [];


/* =========================================================
   LOAD USERS
========================================================= */

async function loadAdminUsers() {

    const data =
        await apiRequest(
            "/admin/users"
        );


    if (!data.success) {

        console.error(
            "Users API:",
            data.message
        );

        return [];
    }


    adminUsers =
        Array.isArray(data.users)
            ? data.users
            : [];


    return adminUsers;
}


/* =========================================================
   LOAD RESPONDERS
========================================================= */

async function loadAdminHelpers() {

    const data =
        await apiRequest(
            "/admin/helpers"
        );


    if (!data.success) {

        console.error(
            "Responders API:",
            data.message
        );

        return [];
    }


    adminHelpers =
        Array.isArray(data.helpers)
            ? data.helpers
            : [];


    return adminHelpers;
}


/* =========================================================
   LOAD EMERGENCIES
========================================================= */

async function loadAdminEmergencies() {

    const data =
        await apiRequest(
            "/admin/emergencies"
        );


    if (!data.success) {

        console.error(
            "Emergencies API:",
            data.message
        );

        return [];
    }


    adminEmergencies =
        Array.isArray(data.emergencies)
            ? data.emergencies
            : [];


    return adminEmergencies;
}


/* =========================================================
   LOGOUT BUTTONS
========================================================= */

function setupLogoutButtons() {

    const buttons =
        document.querySelectorAll(
            "#adminLogout, #logoutBtn"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                logoutAdmin
            );
        }
    );
}


/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {

    if (!requireAdmin()) {
        return;
    }


    const totalUsers =
        document.getElementById(
            "totalUsers"
        );


    const totalResponders =
        document.getElementById(
            "totalResponders"
        );


    const totalEmergencies =
        document.getElementById(
            "totalEmergencies"
        );


    const activeEmergencies =
        document.getElementById(
            "activeEmergencies"
        );


    try {

        const [
            users,
            helpers,
            emergencies
        ] =
            await Promise.all([
                loadAdminUsers(),
                loadAdminHelpers(),
                loadAdminEmergencies()
            ]);


        if (totalUsers) {

            totalUsers.textContent =
                users.length;
        }


        if (totalResponders) {

            totalResponders.textContent =
                helpers.length;
        }


        if (totalEmergencies) {

            totalEmergencies.textContent =
                emergencies.length;
        }


        if (activeEmergencies) {

            activeEmergencies.textContent =
                emergencies.filter(
                    emergency =>
                        emergency.status !==
                            "resolved" &&
                        emergency.status !==
                            "cancelled"
                ).length;
        }


        renderRecentEmergencies(
            emergencies
        );


        renderPendingResponders(
            helpers
        );


    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );
    }
}


/* =========================================================
   RECENT EMERGENCIES
========================================================= */

function renderRecentEmergencies(
    emergencies
) {

    const container =
        document.getElementById(
            "recentEmergencies"
        );


    if (!container) {
        return;
    }


    if (!emergencies.length) {

        container.innerHTML = `
            <div class="admin-empty">

                <div>🚨</div>

                <h3>
                    No emergencies yet
                </h3>

                <p>
                    Emergency reports will appear here.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML =
        emergencies
            .slice(0, 5)
            .map(
                emergency => {

                    const user =
                        emergency.user || {};


                    return `
                        <div class="admin-table-row">

                            <div>

                                <strong>
                                    ${escapeHtml(
                                        formatText(
                                            emergency.type
                                        )
                                    )}
                                </strong>

                                <small>
                                    ${escapeHtml(
                                        emergency.description ||
                                        "No description"
                                    )}
                                </small>

                            </div>


                            <div>

                                ${escapeHtml(
                                    user.name ||
                                    "Unknown User"
                                )}

                            </div>


                            <div>

                                <span
                                    class="admin-status ${escapeHtml(
                                        emergency.status ||
                                        "pending"
                                    )}"
                                >
                                    ${escapeHtml(
                                        formatText(
                                            emergency.status ||
                                            "pending"
                                        )
                                    )}
                                </span>

                            </div>


                            <div>

                                ${escapeHtml(
                                    formatDate(
                                        emergency.createdAt
                                    )
                                )}

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   DASHBOARD - PENDING RESPONDERS
========================================================= */

function renderPendingResponders(
    helpers
) {

    const container =
        findElement([
            "pendingResponders",
            "pendingRespondersList"
        ]);


    if (!container) {
        return;
    }


    const pending =
        helpers.filter(
            helper =>
                helper.verificationStatus ===
                "pending"
        );


    if (!pending.length) {

        container.innerHTML = `
            <div class="admin-empty">

                <div>🛡️</div>

                <h3>
                    No pending responders
                </h3>

                <p>
                    There are no responder applications waiting for verification.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML =
        pending
            .slice(0, 5)
            .map(
                helper => {

                    const user =
                        helper.user || {};


                    return `
                        <div class="admin-pending-card">

                            <div class="admin-avatar">
                                🛡️
                            </div>


                            <div class="admin-pending-info">

                                <strong>
                                    ${escapeHtml(
                                        user.name ||
                                        "Unknown Responder"
                                    )}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        user.email ||
                                        "No email"
                                    )}
                                </span>

                                <small>
                                    Applied:
                                    ${escapeHtml(
                                        formatDate(
                                            helper.createdAt
                                        )
                                    )}
                                </small>

                            </div>


                            <button
                                class="admin-action-button"
                                onclick="verifyResponder('${escapeHtml(
                                    helper._id
                                )}')"
                            >
                                Verify
                            </button>


                            <button
                                class="admin-danger-button"
                                onclick="rejectResponder('${escapeHtml(
                                    helper._id
                                )}')"
                            >
                                Reject
                            </button>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   RESPONDERS PAGE
========================================================= */

async function loadRespondersPage() {

    if (!requireAdmin()) {
        return;
    }


    const container =
        document.getElementById(
            "adminResponderList"
        );


    if (container) {

        container.innerHTML = `
            <div class="admin-loading">
                Loading responder profiles...
            </div>
        `;
    }


    try {

        const helpers =
            await loadAdminHelpers();


        renderRespondersTable(
            helpers
        );


    } catch (error) {

        console.error(
            "Responder page error:",
            error
        );


        showResponderError();
    }
}


/* =========================================================
   RENDER RESPONDERS
========================================================= */

function renderRespondersTable(
    helpers
) {

    const container =
        findElement([
            "adminResponderList",
            "respondersTable",
            "adminRespondersList"
        ]);


    const countElement =
        document.getElementById(
            "responderCount"
        );


    if (!container) {

        console.error(
            "ResQ Admin: responder container not found."
        );

        return;
    }


    helpers =
        Array.isArray(helpers)
            ? helpers
            : [];


    if (countElement) {

        countElement.textContent =
            `${helpers.length} ${
                helpers.length === 1
                    ? "Responder"
                    : "Responders"
            }`;
    }


    if (!helpers.length) {

        container.innerHTML = `
            <div class="admin-empty">

                <div>🛡️</div>

                <h3>
                    No responders found
                </h3>

                <p>
                    No responder profiles are currently registered.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML =
        helpers
            .map(
                helper => {

                    const user =
                        helper.user || {};


                    const status =
                        helper.verificationStatus ||
                        "pending";


                    const helpTypes =
                        Array.isArray(
                            helper.helpTypes
                        )
                            ? helper.helpTypes
                            : [];


                    const available =
                        helper.isAvailable
                            ? "Available"
                            : "Offline";


                    return `
                        <div class="admin-table-row responder-row">

                            <div class="admin-person-cell">

                                <div class="admin-avatar">
                                    🛡️
                                </div>

                                <div>

                                    <strong>
                                        ${escapeHtml(
                                            user.name ||
                                            "Unknown Responder"
                                        )}
                                    </strong>

                                    <small>
                                        ${escapeHtml(
                                            user.email ||
                                            "No email"
                                        )}
                                    </small>

                                </div>

                            </div>


                            <div>

                                ${escapeHtml(
                                    user.phone ||
                                    "—"
                                )}

                            </div>


                            <div>

                                ${
                                    helpTypes.length

                                        ? helpTypes
                                            .map(
                                                type =>
                                                    `
                                                    <span class="admin-tag">
                                                        ${escapeHtml(
                                                            formatText(type)
                                                        )}
                                                    </span>
                                                    `
                                            )
                                            .join(" ")

                                        : "—"
                                }

                            </div>


                            <div>

                                <span
                                    class="admin-status ${escapeHtml(
                                        status
                                    )}"
                                >
                                    ${escapeHtml(
                                        formatText(
                                            status
                                        )
                                    )}
                                </span>

                            </div>


                            <div>

                                <span
                                    class="admin-status ${
                                        helper.isAvailable
                                            ? "verified"
                                            : "pending"
                                    }"
                                >
                                    ${escapeHtml(
                                        available
                                    )}
                                </span>

                            </div>


                            <div>

                                ${escapeHtml(
                                    formatDate(
                                        helper.createdAt
                                    )
                                )}

                            </div>


                            <div class="admin-actions">

                                ${
                                    status ===
                                    "pending"

                                        ? `
                                            <button
                                                class="admin-action-button"
                                                onclick="verifyResponder('${escapeHtml(
                                                    helper._id
                                                )}')"
                                            >
                                                Verify
                                            </button>

                                            <button
                                                class="admin-danger-button"
                                                onclick="rejectResponder('${escapeHtml(
                                                    helper._id
                                                )}')"
                                            >
                                                Reject
                                            </button>
                                          `

                                        : ""
                                }

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   RESPONDER ERROR
========================================================= */

function showResponderError() {

    const container =
        document.getElementById(
            "adminResponderList"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `
        <div class="admin-empty">

            <div>⚠️</div>

            <h3>
                Unable to load responders
            </h3>

            <p>
                Please refresh the page and try again.
            </p>

        </div>
    `;
}


/* =========================================================
   VERIFY RESPONDER
========================================================= */

async function verifyResponder(
    helperId
) {

    if (!helperId) {
        return;
    }


    const confirmed =
        window.confirm(
            "Verify this responder?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const data =
            await apiRequest(
                `/admin/helpers/${helperId}/verify`,
                {
                    method: "PUT"
                }
            );


        if (!data.success) {

            alert(
                data.message ||
                "Unable to verify responder."
            );

            return;
        }


        alert(
            "Responder verified successfully."
        );


        await loadRespondersPage();


    } catch (error) {

        console.error(
            "Verify responder error:",
            error
        );


        alert(
            "Unable to connect to ResQ server."
        );
    }
}


/* =========================================================
   REJECT RESPONDER
========================================================= */

async function rejectResponder(
    helperId
) {

    if (!helperId) {
        return;
    }


    const confirmed =
        window.confirm(
            "Reject this responder application?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const data =
            await apiRequest(
                `/admin/helpers/${helperId}/reject`,
                {
                    method: "PUT"
                }
            );


        if (!data.success) {

            alert(
                data.message ||
                "Unable to reject responder."
            );

            return;
        }


        alert(
            "Responder application rejected."
        );


        await loadRespondersPage();


    } catch (error) {

        console.error(
            "Reject responder error:",
            error
        );


        alert(
            "Unable to connect to ResQ server."
        );
    }
}


/* =========================================================
   EMERGENCIES PAGE
========================================================= */

async function loadEmergenciesPage() {

    if (!requireAdmin()) {
        return;
    }


    const container =
        document.getElementById(
            "adminEmergencyList"
        );


    if (container) {

        container.innerHTML = `
            <div class="admin-loading">
                Loading emergency cases...
            </div>
        `;
    }


    try {

        const emergencies =
            await loadAdminEmergencies();


        renderEmergenciesTable(
            emergencies
        );


        setupEmergencyFilters();


    } catch (error) {

        console.error(
            "Emergency page error:",
            error
        );


        if (container) {

            container.innerHTML = `
                <div class="admin-empty">

                    <div>⚠️</div>

                    <h3>
                        Unable to load emergency cases
                    </h3>

                    <p>
                        Please refresh the page and try again.
                    </p>

                </div>
            `;
        }
    }
}


/* =========================================================
   RENDER EMERGENCIES
========================================================= */

function renderEmergenciesTable(
    emergencies
) {

    const container =
        findElement([
            "adminEmergencyList",
            "emergenciesTable",
            "adminEmergenciesList"
        ]);


    const countElement =
        document.getElementById(
            "emergencyCount"
        );


    if (!container) {

        console.error(
            "ResQ Admin: emergency container not found."
        );

        return;
    }


    emergencies =
        Array.isArray(emergencies)
            ? emergencies
            : [];


    if (countElement) {

        countElement.textContent =
            `${emergencies.length} ${
                emergencies.length === 1
                    ? "Case"
                    : "Cases"
            }`;
    }


    if (!emergencies.length) {

        container.innerHTML = `
            <div class="admin-empty">

                <div>🚨</div>

                <h3>
                    No emergencies found
                </h3>

                <p>
                    Reported emergencies will appear here.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML =
        emergencies
            .map(
                emergency => {

                    const user =
                        emergency.user || {};


                    const helper =
                        emergency.assignedHelper ||
                        {};


                    const location =
                        emergency.location ||
                        {};


                    const latitude =
                        Number(
                            location.latitude
                        );


                    const longitude =
                        Number(
                            location.longitude
                        );


                    const validLocation =
                        Number.isFinite(
                            latitude
                        ) &&
                        Number.isFinite(
                            longitude
                        );


                    const status =
                        emergency.status ||
                        "pending";


                    const priority =
                        emergency.priority ||
                        "high";


                    return `
                        <div
                            class="admin-table-row emergency-row"
                            data-status="${escapeHtml(status)}"
                        >

                            <div>

                                <strong>
                                    ${escapeHtml(
                                        formatText(
                                            emergency.type
                                        )
                                    )}
                                </strong>

                                <small>
                                    ${escapeHtml(
                                        emergency.description ||
                                        "No description"
                                    )}
                                </small>

                                <small>
                                    Priority:
                                    ${escapeHtml(
                                        formatText(
                                            priority
                                        )
                                    )}
                                </small>

                            </div>


                            <div>

                                <strong>
                                    ${escapeHtml(
                                        user.name ||
                                        "Unknown User"
                                    )}
                                </strong>

                                <small>
                                    ${escapeHtml(
                                        user.phone ||
                                        "—"
                                    )}
                                </small>

                                <small>
                                    ${escapeHtml(
                                        user.email ||
                                        "—"
                                    )}
                                </small>

                            </div>


                            <div>

                                ${
                                    validLocation

                                        ? `
                                            <a
                                                href="https://www.google.com/maps?q=${latitude},${longitude}"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="admin-location-link"
                                            >
                                                📍 View Location
                                            </a>

                                            <small>
                                                ${latitude.toFixed(5)},
                                                ${longitude.toFixed(5)}
                                            </small>
                                          `

                                        : `
                                            <span>
                                                Location unavailable
                                            </span>
                                          `
                                }

                            </div>


                            <div>

                                <span
                                    class="admin-status ${escapeHtml(
                                        status
                                    )}"
                                >
                                    ${escapeHtml(
                                        formatText(
                                            status
                                        )
                                    )}
                                </span>

                            </div>


                            <div>

                                ${
                                    helper.name

                                        ? `
                                            <strong>
                                                ${escapeHtml(
                                                    helper.name
                                                )}
                                            </strong>

                                            <small>
                                                Assigned responder
                                            </small>
                                          `

                                        : `
                                            <span>
                                                Not assigned
                                            </span>
                                          `
                                }

                            </div>


                            <div>

                                ${escapeHtml(
                                    formatDate(
                                        emergency.createdAt
                                    )
                                )}

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   EMERGENCY FILTERS
========================================================= */

function filterEmergencies(
    selectedFilter = null
) {

    let filter =
        selectedFilter;


    /*
       If called from the old search/filter UI,
       read those controls.
    */

    if (
        typeof selectedFilter !==
        "string"
    ) {

        filter =
            "all";
    }


    if (
        !filter ||
        filter === "all"
    ) {

        renderEmergenciesTable(
            adminEmergencies
        );

        return;
    }


    const filtered =
        adminEmergencies.filter(
            emergency =>
                emergency.status ===
                filter
        );


    renderEmergenciesTable(
        filtered
    );
}


/* =========================================================
   EMERGENCY FILTER BUTTONS
========================================================= */

function setupEmergencyFilters() {

    const buttons =
        document.querySelectorAll(
            ".admin-filter"
        );


    if (!buttons.length) {
        return;
    }


    buttons.forEach(
        button => {

            if (
                button.dataset.resqReady ===
                "true"
            ) {
                return;
            }


            button.dataset.resqReady =
                "true";


            button.addEventListener(
                "click",
                () => {

                    buttons.forEach(
                        item => {

                            item.classList.remove(
                                "active"
                            );
                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    const filter =
                        button.dataset.filter ||
                        "all";


                    filterEmergencies(
                        filter
                    );

                }
            );
        }
    );
}


/* =========================================================
   USERS PAGE
========================================================= */

async function loadUsersPage() {

    if (!requireAdmin()) {
        return;
    }


    const container =
        findElement([
            "adminUserList",
            "usersTable",
            "adminUsersList"
        ]);


    if (container) {

        container.innerHTML = `
            <div class="admin-loading">
                Loading registered users...
            </div>
        `;
    }


    try {

        const users =
            await loadAdminUsers();


        renderUsersTable(
            users
        );


        setupUserSearch();


    } catch (error) {

        console.error(
            "Users page error:",
            error
        );


        if (container) {

            container.innerHTML = `
                <div class="admin-empty">

                    <div>⚠️</div>

                    <h3>
                        Unable to load users
                    </h3>

                    <p>
                        Please refresh the page and try again.
                    </p>

                </div>
            `;
        }
    }
}


/* =========================================================
   RENDER USERS
========================================================= */

function renderUsersTable(
    users
) {

    const container =
        findElement([
            "adminUserList",
            "usersTable",
            "adminUsersList"
        ]);


    const countElement =
        document.getElementById(
            "userCount"
        );


    if (!container) {

        console.error(
            "ResQ Admin: user container not found."
        );

        return;
    }


    users =
        Array.isArray(users)
            ? users
            : [];


    if (countElement) {

        countElement.textContent =
            `${users.length} ${
                users.length === 1
                    ? "User"
                    : "Users"
            }`;
    }


    if (!users.length) {

        container.innerHTML = `
            <div class="admin-empty">

                <div>👥</div>

                <h3>
                    No users found
                </h3>

                <p>
                    No registered ResQ users match your search.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML =
        users
            .map(
                user => {

                    return `
                        <div class="admin-table-row user-row">

                            <div class="admin-person-cell">

                                <div class="admin-avatar">
                                    👤
                                </div>

                                <div>

                                    <strong>
                                        ${escapeHtml(
                                            user.name ||
                                            "Unknown User"
                                        )}
                                    </strong>

                                    <small>
                                        ${escapeHtml(
                                            user.email ||
                                            "No email"
                                        )}
                                    </small>

                                </div>

                            </div>


                            <div>

                                ${escapeHtml(
                                    user.phone ||
                                    "—"
                                )}

                            </div>


                            <div>

                                <span
                                    class="admin-role ${escapeHtml(
                                        user.role ||
                                        "user"
                                    )}"
                                >
                                    ${escapeHtml(
                                        formatText(
                                            user.role ||
                                            "user"
                                        )
                                    )}
                                </span>

                            </div>


                            <div>

                                ${escapeHtml(
                                    formatDate(
                                        user.createdAt
                                    )
                                )}

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   USER SEARCH
========================================================= */

function filterUsers() {

    const searchInput =
        document.getElementById(
            "userSearch"
        );


    if (!searchInput) {
        return;
    }


    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const filtered =
        adminUsers.filter(
            user => {

                const name =
                    String(
                        user.name ||
                        ""
                    )
                        .toLowerCase();


                const email =
                    String(
                        user.email ||
                        ""
                    )
                        .toLowerCase();


                const phone =
                    String(
                        user.phone ||
                        ""
                    )
                        .toLowerCase();


                const role =
                    String(
                        user.role ||
                        ""
                    )
                        .toLowerCase();


                return (
                    name.includes(search) ||
                    email.includes(search) ||
                    phone.includes(search) ||
                    role.includes(search)
                );
            }
        );


    renderUsersTable(
        filtered
    );
}


/* =========================================================
   USER SEARCH SETUP
========================================================= */

function setupUserSearch() {

    const input =
        document.getElementById(
            "userSearch"
        );


    if (!input) {
        return;
    }


    if (
        input.dataset.resqReady ===
        "true"
    ) {
        return;
    }


    input.dataset.resqReady =
        "true";


    input.addEventListener(
        "input",
        filterUsers
    );
}


/* =========================================================
   ANALYTICS
========================================================= */

async function loadAnalytics() {

    if (!requireAdmin()) {
        return;
    }


    try {

        const [
            users,
            helpers,
            emergencies
        ] =
            await Promise.all([
                loadAdminUsers(),
                loadAdminHelpers(),
                loadAdminEmergencies()
            ]);


        const resolved =
            emergencies.filter(
                emergency =>
                    emergency.status ===
                    "resolved"
            ).length;


        const cancelled =
            emergencies.filter(
                emergency =>
                    emergency.status ===
                    "cancelled"
            ).length;


        const active =
            emergencies.filter(
                emergency =>
                    emergency.status !==
                        "resolved" &&
                    emergency.status !==
                        "cancelled"
            ).length;


        const pendingResponders =
            helpers.filter(
                helper =>
                    helper.verificationStatus ===
                    "pending"
            ).length;


        const verifiedResponders =
            helpers.filter(
                helper =>
                    helper.verificationStatus ===
                    "verified"
            ).length;


        const rejectedResponders =
            helpers.filter(
                helper =>
                    helper.verificationStatus ===
                    "rejected"
            ).length;


        /*
           Update statistic cards.
           Supports several possible IDs.
        */

        setText(
            [
                "analyticsUsers",
                "totalAnalyticsUsers",
                "totalUsers"
            ],
            users.length
        );


        setText(
            [
                "analyticsResponders",
                "totalAnalyticsResponders",
                "totalResponders"
            ],
            helpers.length
        );


        setText(
            [
                "analyticsEmergencies",
                "totalAnalyticsEmergencies",
                "totalEmergencies"
            ],
            emergencies.length
        );


        setText(
            [
                "analyticsResolved",
                "resolvedEmergencies",
                "resolvedCount"
            ],
            resolved
        );


        setText(
            [
                "analyticsActive",
                "activeEmergencies",
                "activeCount"
            ],
            active
        );


        setText(
            [
                "analyticsPending",
                "pendingResponders"
            ],
            pendingResponders
        );


        setText(
            [
                "analyticsVerified",
                "verifiedResponders"
            ],
            verifiedResponders
        );


        setText(
            [
                "analyticsRejected",
                "rejectedResponders"
            ],
            rejectedResponders
        );


        setText(
            [
                "cancelledEmergencies",
                "cancelledCount"
            ],
            cancelled
        );


        renderAnalyticsTypes(
            emergencies
        );


        renderAnalyticsStatuses(
            emergencies
        );


        renderResponderAnalytics(
            helpers
        );


    } catch (error) {

        console.error(
            "Analytics loading error:",
            error
        );


        showAnalyticsError();
    }
}


/* =========================================================
   SET TEXT
========================================================= */

function setText(
    ids,
    value
) {

    const element =
        findElement(ids);


    if (element) {

        element.textContent =
            value;
    }
}


/* =========================================================
   ANALYTICS CONTAINER FINDER
========================================================= */

function findAnalyticsContainer(
    ids,
    loadingTexts = []
) {

    const direct =
        findElement(ids);


    if (direct) {
        return direct;
    }


    /*
       Fallback for older analytics HTML:
       find the element containing
       "Loading analytics..." or
       "Loading statistics..."
    */

    const candidates =
        document.querySelectorAll(
            ".admin-panel, .admin-card, section, div"
        );


    for (
        const element of candidates
    ) {

        const text =
            (
                element.textContent ||
                ""
            )
                .trim()
                .toLowerCase();


        for (
            const loadingText
            of loadingTexts
        ) {

            if (
                text.includes(
                    loadingText.toLowerCase()
                )
            ) {

                const child =
                    Array.from(
                        element.children
                    ).find(
                        child =>
                            (
                                child.textContent ||
                                ""
                            )
                                .toLowerCase()
                                .includes(
                                    loadingText.toLowerCase()
                                )
                    );


                return child ||
                    element;
            }
        }
    }


    return null;
}


/* =========================================================
   ANALYTICS - EMERGENCY TYPES
========================================================= */

function renderAnalyticsTypes(
    emergencies
) {

    const container =
        findAnalyticsContainer(
            [
                "emergencyTypeAnalytics",
                "analyticsEmergencyTypes",
                "emergencyTypes",
                "emergencyTypeChart"
            ],
            [
                "Loading analytics..."
            ]
        );


    if (!container) {

        console.warn(
            "Emergency type analytics container not found."
        );

        return;
    }


    const counts = {};


    emergencies.forEach(
        emergency => {

            const type =
                emergency.type ||
                "other";


            counts[type] =
                (
                    counts[type] ||
                    0
                ) + 1;
        }
    );


    const entries =
        Object.entries(
            counts
        )
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );


    if (!entries.length) {

        container.innerHTML = `
            <div class="admin-empty">
                No emergency data available.
            </div>
        `;

        return;
    }


    const total =
        emergencies.length;


    container.innerHTML =
        entries
            .map(
                ([type, count]) => {

                    const percentage =
                        total > 0
                            ? Math.round(
                                (count / total) *
                                100
                            )
                            : 0;


                    return `
                        <div class="analytics-bar">

                            <div class="analytics-bar-top">

                                <span>
                                    ${escapeHtml(
                                        formatText(type)
                                    )}
                                </span>

                                <strong>
                                    ${count}
                                    (${percentage}%)
                                </strong>

                            </div>


                            <div class="analytics-bar-track">

                                <div
                                    class="analytics-bar-fill"
                                    style="width:${percentage}%"
                                ></div>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   ANALYTICS - STATUS
========================================================= */

function renderAnalyticsStatuses(
    emergencies
) {

    const container =
        findAnalyticsContainer(
            [
                "emergencyStatusAnalytics",
                "analyticsEmergencyStatuses",
                "emergencyStatusChart",
                "emergencyStatuses"
            ],
            [
                "Loading statistics..."
            ]
        );


    if (!container) {

        console.warn(
            "Emergency status analytics container not found."
        );

        return;
    }


    const counts = {};


    emergencies.forEach(
        emergency => {

            const status =
                emergency.status ||
                "unknown";


            counts[status] =
                (
                    counts[status] ||
                    0
                ) + 1;
        }
    );


    const entries =
        Object.entries(
            counts
        )
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );


    if (!entries.length) {

        container.innerHTML = `
            <div class="admin-empty">
                No emergency statistics available.
            </div>
        `;

        return;
    }


    container.innerHTML =
        entries
            .map(
                ([status, count]) => {

                    return `
                        <div class="analytics-status-row">

                            <span>
                                ${escapeHtml(
                                    formatText(
                                        status
                                    )
                                )}
                            </span>

                            <strong>
                                ${count}
                            </strong>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   ANALYTICS - RESPONDERS
========================================================= */

function renderResponderAnalytics(
    helpers
) {

    const container =
        findElement([
            "responderAnalytics",
            "responderStatusAnalytics",
            "analyticsResponderStatus"
        ]);


    if (!container) {
        return;
    }


    const verified =
        helpers.filter(
            helper =>
                helper.verificationStatus ===
                "verified"
        ).length;


    const pending =
        helpers.filter(
            helper =>
                helper.verificationStatus ===
                "pending"
        ).length;


    const rejected =
        helpers.filter(
            helper =>
                helper.verificationStatus ===
                "rejected"
        ).length;


    container.innerHTML = `

        <div class="analytics-status-row">
            <span>Verified</span>
            <strong>${verified}</strong>
        </div>

        <div class="analytics-status-row">
            <span>Pending</span>
            <strong>${pending}</strong>
        </div>

        <div class="analytics-status-row">
            <span>Rejected</span>
            <strong>${rejected}</strong>
        </div>

    `;
}


/* =========================================================
   ANALYTICS ERROR
========================================================= */

function showAnalyticsError() {

    const containers =
        document.querySelectorAll(
            ".admin-loading"
        );


    containers.forEach(
        element => {

            const text =
                (
                    element.textContent ||
                    ""
                ).toLowerCase();


            if (
                text.includes(
                    "loading analytics"
                ) ||
                text.includes(
                    "loading statistics"
                )
            ) {

                element.innerHTML = `
                    <div class="admin-empty">

                        <div>⚠️</div>

                        <h3>
                            Unable to load analytics
                        </h3>

                        <p>
                            Please refresh the page and try again.
                        </p>

                    </div>
                `;
            }
        }
    );
}


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupLogoutButtons();


        const path =
            window.location.pathname
                .toLowerCase();


        /* -------------------------------------------------
           DO NOT RUN PAGE CODE ON LOGIN
        ------------------------------------------------- */

        if (
            path.endsWith(
                "/login.html"
            )
        ) {
            return;
        }


        /* -------------------------------------------------
           PROTECT ADMIN PAGES
        ------------------------------------------------- */

        if (
            path.includes(
                "/admin/"
            )
        ) {

            if (!requireAdmin()) {
                return;
            }
        }


        /* -------------------------------------------------
           DASHBOARD
        ------------------------------------------------- */

        if (
            path.endsWith(
                "/dashboard.html"
            )
        ) {

            loadDashboard();

            return;
        }


        /* -------------------------------------------------
           RESPONDERS
        ------------------------------------------------- */

        if (
            path.endsWith(
                "/responders.html"
            )
        ) {

            loadRespondersPage();

            return;
        }


        /* -------------------------------------------------
           EMERGENCIES
        ------------------------------------------------- */

        if (
            path.endsWith(
                "/emergencies.html"
            )
        ) {

            loadEmergenciesPage();

            return;
        }


        /* -------------------------------------------------
           USERS
        ------------------------------------------------- */

        if (
            path.endsWith(
                "/users.html"
            )
        ) {

            loadUsersPage();

            return;
        }


        /* -------------------------------------------------
           ANALYTICS
        ------------------------------------------------- */

        if (
            path.endsWith(
                "/analytics.html"
            )
        ) {

            loadAnalytics();

            return;
        }

    }
);