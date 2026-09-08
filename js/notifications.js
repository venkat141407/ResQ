const API_URL = "/api";


const token =
    localStorage.getItem(
        "resqToken"
    );


if (!token) {

    window.location.href =
        "login.html";

}


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


// =====================================================
// LOAD NOTIFICATIONS
// =====================================================

async function loadNotifications() {

    try {

        const response =
            await fetch(
                `${API_URL}/notifications`,
                {

                    headers: {

                        "Authorization":
                            `Bearer ${token}`

                    }

                }
            );


        const data =
            await response.json();


        if (!data.success) {

            showNotificationError(
                data.message ||
                "Unable to load notifications."
            );

            return;

        }


        const notifications =
            data.notifications || [];


        const unreadCount =
            data.unreadCount || 0;


        updateNotificationCount(
            unreadCount
        );


        updateSummary(
            notifications.length,
            unreadCount
        );


        renderNotifications(
            notifications
        );


    } catch (error) {

        console.error(
            "Notification loading error:",
            error
        );


        showNotificationError(
            "Unable to connect to ResQ server."
        );

    }

}


// =====================================================
// UPDATE COUNT
// =====================================================

function updateNotificationCount(
    count
) {

    if (!notificationNavCount) {
        return;
    }


    notificationNavCount.textContent =
        count;


    if (count > 0) {

        notificationNavCount.classList.add(
            "has-notifications"
        );

    } else {

        notificationNavCount.classList.remove(
            "has-notifications"
        );

    }

}


// =====================================================
// UPDATE SUMMARY
// =====================================================

function updateSummary(
    total,
    unread
) {

    if (!notificationSummary) {
        return;
    }


    if (total === 0) {

        notificationSummary.textContent =
            "No notifications yet.";

        return;

    }


    if (unread === 0) {

        notificationSummary.textContent =
            `${total} notification${total === 1 ? "" : "s"} · All caught up`;

        return;

    }


    notificationSummary.textContent =
        `${unread} unread notification${unread === 1 ? "" : "s"} · ${total} total`;

}


// =====================================================
// RENDER NOTIFICATIONS
// =====================================================

function renderNotifications(
    notifications
) {

    if (!notificationList) {
        return;
    }


    if (!notifications.length) {

        notificationList.innerHTML = `

            <div class="dashboard-card notification-empty">

                <div class="notification-empty-icon">
                    🔔
                </div>


                <h3>
                    You're all caught up
                </h3>


                <p>
                    New ResQ activity and emergency
                    updates will appear here.
                </p>

            </div>

        `;

        return;

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


            const formattedDate =
                date.toLocaleString();


            card.innerHTML = `

                <div class="notification-icon">

                    ${icon}

                </div>


                <div class="notification-content">

                    <div class="notification-top">

                        <h3>
                            ${escapeHtml(
                                notification.title
                            )}
                        </h3>


                        ${
                            !notification.isRead
                                ? `
                                    <span class="unread-dot">
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


                    <div class="notification-bottom">

                        <small>
                            ${formattedDate}
                        </small>


                        ${
                            notification.emergency
                                ? `
                                    <a
                                        href="tracking.html?id=${notification.emergency._id}"
                                        class="card-link"
                                    >
                                        View Emergency →
                                    </a>
                                `
                                : ""
                        }


                        ${
                            !notification.isRead
                                ? `
                                    <button
                                        class="notification-read-btn"
                                        onclick="markAsRead(
                                            '${notification._id}'
                                        )"
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

}


// =====================================================
// NOTIFICATION ICON
// =====================================================

function getNotificationIcon(
    type
) {

    const icons = {

        emergency:
            "🚨",

        help_request:
            "🛡️",

        match:
            "🤝",

        accepted:
            "✅",

        completed:
            "🏁",

        system:
            "ℹ️"

    };


    return (
        icons[type] ||
        "🔔"
    );

}


// =====================================================
// MARK ONE AS READ
// =====================================================

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

                        "Authorization":
                            `Bearer ${token}`

                    }

                }
            );


        const data =
            await response.json();


        if (!data.success) {

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


        alert(
            "Unable to connect to ResQ server."
        );

    }

}


// =====================================================
// MARK ALL AS READ
// =====================================================

if (markAllReadBtn) {

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

                                "Authorization":
                                    `Bearer ${token}`

                            }

                        }
                    );


                const data =
                    await response.json();


                if (!data.success) {

                    alert(
                        data.message ||
                        "Unable to update notifications."
                    );

                    return;

                }


                await loadNotifications();


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


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(
    text
) {

    if (!text) {
        return "";
    }


    return String(text)
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


// =====================================================
// ERROR
// =====================================================

function showNotificationError(
    message
) {

    if (!notificationList) {
        return;
    }


    notificationList.innerHTML = `

        <div class="dashboard-card notification-empty">

            <div class="notification-empty-icon">
                ⚠️
            </div>


            <h3>
                Notifications unavailable
            </h3>


            <p>
                ${escapeHtml(message)}
            </p>

        </div>

    `;

}


// =====================================================
// LOGOUT
// =====================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

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


// =====================================================
// INITIAL LOAD
// =====================================================

loadNotifications();


// =====================================================
// REFRESH
// =====================================================

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