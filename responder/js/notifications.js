const API_URL = "/api";


const token =
    localStorage.getItem(
        "resqToken"
    );


const userData =
    localStorage.getItem(
        "resqUser"
    );


/* =========================================================
   AUTH CHECK
========================================================= */

if (
    !token ||
    !userData
) {

    window.location.href =
        "login.html";
}


const user =
    JSON.parse(
        userData
    );


if (
    user.role !==
    "helper"
) {

    window.location.href =
        "../frontend/dashboard.html";
}


/* =========================================================
   ELEMENTS
========================================================= */

const notificationList =
    document.getElementById(
        "notificationList"
    );


const notificationSummary =
    document.getElementById(
        "notificationSummary"
    );


const notificationNavCount =
    document.getElementById(
        "notificationNavCount"
    );


const markAllReadBtn =
    document.getElementById(
        "markAllReadBtn"
    );


/* =========================================================
   LOAD NOTIFICATIONS
========================================================= */

async function loadNotifications() {

    if (
        !notificationList
    ) {

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/notifications`,
                {

                    headers: {

                        Authorization:
                            `Bearer ${token}`

                    }

                }
            );


        const data =
            await response.json();


        if (
            !data.success
        ) {

            notificationList.innerHTML = `

                <div
                    class="dashboard-card notification-empty"
                >

                    <div
                        class="notification-empty-icon"
                    >
                        ⚠️
                    </div>

                    <h3>
                        Unable to load notifications
                    </h3>

                    <p>
                        ${
                            data.message ||
                            "Something went wrong."
                        }
                    </p>

                </div>

            `;

            return;
        }


        updateNotificationCount(
            data.unreadCount ||
            0
        );


        renderNotifications(
            data.notifications ||
            []
        );


    } catch (error) {

        console.error(
            "Responder notification error:",
            error
        );


        notificationList.innerHTML = `

            <div
                class="dashboard-card notification-empty"
            >

                <div
                    class="notification-empty-icon"
                >
                    ⚠️
                </div>

                <h3>
                    Connection error
                </h3>

                <p>
                    Unable to connect to the ResQ server.
                </p>

            </div>

        `;
    }
}


/* =========================================================
   UPDATE COUNT
========================================================= */

function updateNotificationCount(
    count
) {

    if (
        !notificationNavCount
    ) {

        return;
    }


    notificationNavCount.textContent =
        count;


    if (
        count > 0
    ) {

        notificationNavCount.classList.add(
            "has-notifications"
        );

    } else {

        notificationNavCount.classList.remove(
            "has-notifications"
        );
    }
}


/* =========================================================
   RENDER NOTIFICATIONS
========================================================= */

function renderNotifications(
    notifications
) {

    if (
        !notificationList
    ) {

        return;
    }


    if (
        !notifications.length
    ) {

        if (
            notificationSummary
        ) {

            notificationSummary.textContent =
                "You're all caught up.";
        }


        notificationList.innerHTML = `

            <div
                class="dashboard-card notification-empty"
            >

                <div
                    class="notification-empty-icon"
                >
                    🔔
                </div>

                <h3>
                    No notifications
                </h3>

                <p>
                    New emergency assignments and
                    responder updates will appear here.
                </p>

            </div>

        `;

        return;
    }


    const unread =
        notifications.filter(
            notification =>
                !notification.isRead
        ).length;


    if (
        notificationSummary
    ) {

        notificationSummary.textContent =
            unread > 0

                ? `${unread} unread notification${unread === 1 ? "" : "s"}`

                : "You're all caught up.";
    }


    notificationList.innerHTML =
        "";


    notifications.forEach(
        notification => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                `dashboard-card notification-card ${
                    notification.isRead
                        ? "read"
                        : "unread"
                }`;


            const icon =
                getNotificationIcon(
                    notification.type
                );


            const date =
                new Date(
                    notification.createdAt
                );


            const emergencyId =
                notification.emergency
                    ? (
                        notification.emergency._id ||
                        notification.emergency
                    )
                    : null;


            card.innerHTML = `

                <div
                    class="notification-icon"
                >
                    ${icon}
                </div>


                <div
                    class="notification-content"
                >

                    <div
                        class="notification-top"
                    >

                        <h3>
                            ${escapeHtml(
                                notification.title
                            )}
                        </h3>

                        ${
                            !notification.isRead

                            ? `
                                <span
                                    class="unread-dot"
                                >
                                    NEW
                                </span>
                            `

                            : ""
                        }

                    </div>


                    <p>
                        ${escapeHtml(
                            notification.message
                        )}
                    </p>


                    <div
                        class="notification-bottom"
                    >

                        <small>
                            ${date.toLocaleString()}
                        </small>


                        ${
                            emergencyId

                            ? `

                                <a
                                    href="dashboard.html?emergency=${encodeURIComponent(
                                        emergencyId
                                    )}"
                                    class="card-link"
                                >
                                    Open Emergency →
                                </a>

                            `

                            : ""
                        }


                        ${
                            !notification.isRead

                            ? `

                                <button
                                    class="notification-read-btn"
                                    data-id="${notification._id}"
                                >
                                    Mark as read
                                </button>

                            `

                            : ""
                        }

                    </div>

                </div>

            `;


            notificationList.appendChild(
                card
            );
        }
    );


    attachReadHandlers();
}


/* =========================================================
   NOTIFICATION ICON
========================================================= */

function getNotificationIcon(
    type
) {

    const icons = {

        emergency:
            "🚨",

        help_request:
            "🆘",

        match:
            "🛡️",

        accepted:
            "✓",

        completed:
            "✅",

        system:
            "ℹ️"

    };


    return (
        icons[type] ||
        "🔔"
    );
}


/* =========================================================
   MARK ONE AS READ
========================================================= */

function attachReadHandlers() {

    const buttons =
        document.querySelectorAll(
            ".notification-read-btn"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;


                    await markAsRead(
                        id
                    );
                }
            );
        }
    );
}


async function markAsRead(
    notificationId
) {

    try {

        const response =
            await fetch(
                `${API_URL}/notifications/${notificationId}/read`,
                {

                    method:
                        "PUT",

                    headers: {

                        Authorization:
                            `Bearer ${token}`

                    }

                }
            );


        const data =
            await response.json();


        if (
            !data.success
        ) {

            alert(
                data.message ||
                "Unable to update notification."
            );

            return;
        }


        await loadNotifications();

    } catch (error) {

        console.error(
            "Mark notification error:",
            error
        );
    }
}


/* =========================================================
   MARK ALL AS READ
========================================================= */

if (
    markAllReadBtn
) {

    markAllReadBtn.addEventListener(
        "click",
        async () => {

            try {

                markAllReadBtn.disabled =
                    true;


                markAllReadBtn.textContent =
                    "Updating...";


                const response =
                    await fetch(
                        `${API_URL}/notifications/read-all`,
                        {

                            method:
                                "PUT",

                            headers: {

                                Authorization:
                                    `Bearer ${token}`

                            }

                        }
                    );


                const data =
                    await response.json();


                if (
                    !data.success
                ) {

                    alert(
                        data.message ||
                        "Unable to update notifications."
                    );

                } else {

                    await loadNotifications();
                }


            } catch (error) {

                console.error(
                    "Mark all notifications error:",
                    error
                );


                alert(
                    "Unable to connect to ResQ server."
                );


            } finally {

                markAllReadBtn.disabled =
                    false;


                markAllReadBtn.textContent =
                    "✓ Mark All as Read";
            }
        }
    );
}


/* =========================================================
   LOGOUT
========================================================= */

const logoutBtn =
    document.getElementById(
        "responderLogout"
    );


if (
    logoutBtn
) {

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


/* =========================================================
   LOAD
========================================================= */

loadNotifications();


/* =========================================================
   AUTO REFRESH
========================================================= */

const notificationInterval =
    setInterval(
        loadNotifications,
        10000
    );


window.addEventListener(
    "beforeunload",
    () => {

        clearInterval(
            notificationInterval
        );
    }
);


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";
    }


    return String(value)

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