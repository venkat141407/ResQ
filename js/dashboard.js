const API_URL = "/api";


const token =
    localStorage.getItem(
        "resqToken"
    );


const userData =
    localStorage.getItem(
        "resqUser"
    );


if (!token || !userData) {

    window.location.href =
        "login.html";

}


const user =
    JSON.parse(
        userData
    );


// =====================================================
// WELCOME USER
// =====================================================

const welcomeName =
    document.getElementById(
        "welcomeName"
    );


if (welcomeName) {

    welcomeName.textContent =
        user.name;

}


// =====================================================
// NOTIFICATION COUNT
// =====================================================

async function loadNotificationCount() {

    const notificationCount =
        document.getElementById(
            "notificationNavCount"
        );


    if (!notificationCount) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/notifications/unread-count`,
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
            return;
        }


        const count =
            data.unreadCount || 0;


        notificationCount.textContent =
            count;


        if (count > 0) {

            notificationCount.classList.add(
                "has-notifications"
            );

        } else {

            notificationCount.classList.remove(
                "has-notifications"
            );

        }


    } catch (error) {

        console.error(
            "Notification count error:",
            error
        );

    }

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

loadNotificationCount();


// Refresh notification count

setInterval(
    loadNotificationCount,
    10000
);