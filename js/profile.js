const API_URL = "/api";

const token =
    localStorage.getItem(
        "resqToken"
    );

const storedUser =
    localStorage.getItem(
        "resqUser"
    );


// ============================================================
// AUTH
// ============================================================

if (
    !token ||
    !storedUser
) {

    window.location.href =
        "login.html";
}


let currentUser = null;

try {

    currentUser =
        JSON.parse(
            storedUser
        );

} catch (error) {

    localStorage.removeItem(
        "resqToken"
    );

    localStorage.removeItem(
        "resqUser"
    );

    window.location.href =
        "login.html";
}


// ============================================================
// ELEMENTS
// ============================================================

const profileName =
    document.getElementById(
        "profileName"
    );

const profileEmail =
    document.getElementById(
        "profileEmail"
    );

const profilePhone =
    document.getElementById(
        "profilePhone"
    );

const profileRole =
    document.getElementById(
        "profileRole"
    );

const contactsList =
    document.getElementById(
        "contactsList"
    );

const addContactBtn =
    document.getElementById(
        "addContactBtn"
    );

const contactForm =
    document.getElementById(
        "contactForm"
    );

const saveContactBtn =
    document.getElementById(
        "saveContactBtn"
    );

const cancelContactBtn =
    document.getElementById(
        "cancelContactBtn"
    );

const contactName =
    document.getElementById(
        "contactName"
    );

const contactPhone =
    document.getElementById(
        "contactPhone"
    );

const contactRelation =
    document.getElementById(
        "contactRelation"
    );

const profileMessage =
    document.getElementById(
        "profileMessage"
    );


// ============================================================
// LOAD PROFILE
// ============================================================

async function loadProfile() {

    try {

        const response =
            await fetch(
                `${API_URL}/profile`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load profile"
            );
        }

        currentUser =
            data.user;

        // Keep local user information
        // synchronized.
        localStorage.setItem(
            "resqUser",
            JSON.stringify({
                id:
                    currentUser._id,

                name:
                    currentUser.name,

                email:
                    currentUser.email,

                phone:
                    currentUser.phone,

                role:
                    currentUser.role,

                emergencyContacts:
                    currentUser.emergencyContacts ||
                    []
            })
        );

        renderProfile();

    } catch (error) {

        console.error(
            "Profile error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to load profile.",
            true
        );
    }
}


// ============================================================
// RENDER PROFILE
// ============================================================

function renderProfile() {

    if (!currentUser) {
        return;
    }

    if (profileName) {

        profileName.textContent =
            currentUser.name ||
            "Not available";
    }

    if (profileEmail) {

        profileEmail.textContent =
            currentUser.email ||
            "Not available";
    }

    if (profilePhone) {

        profilePhone.textContent =
            currentUser.phone ||
            "Not available";
    }

    if (profileRole) {

        profileRole.textContent =
            formatRole(
                currentUser.role
            );
    }

    renderContacts(
        currentUser.emergencyContacts ||
        []
    );
}


// ============================================================
// RENDER CONTACTS
// ============================================================

function renderContacts(
    contacts
) {

    if (!contactsList) {
        return;
    }

    if (!contacts.length) {

        contactsList.innerHTML = `
            <div class="contacts-empty">
                <div class="contacts-empty-icon">
                    👥
                </div>

                <div>
                    <strong>
                        No emergency contacts added
                    </strong>

                    <p>
                        Add a trusted person so
                        important contact information
                        is available when needed.
                    </p>
                </div>
            </div>
        `;

        return;
    }

    contactsList.innerHTML = "";

    contacts.forEach(
        (
            contact,
            index
        ) => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "contact-card";

            card.innerHTML = `
                <div class="contact-avatar">
                    👤
                </div>

                <div class="contact-info">

                    <strong>
                        ${escapeHtml(
                            contact.name
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            contact.relation ||
                            "Emergency Contact"
                        )}
                    </span>

                    <small>
                        📞 ${escapeHtml(
                            contact.phone
                        )}
                    </small>

                </div>

                <button
                    type="button"
                    class="contact-delete-btn"
                    data-index="${index}"
                    aria-label="Remove contact"
                >
                    Remove
                </button>
            `;

            contactsList.appendChild(
                card
            );
        }
    );
}


// ============================================================
// SHOW CONTACT FORM
// ============================================================

if (addContactBtn) {

    addContactBtn.addEventListener(
        "click",
        () => {

            const contacts =
                currentUser?.emergencyContacts ||
                [];

            if (
                contacts.length >= 5
            ) {

                showMessage(
                    "You can add a maximum of 5 emergency contacts.",
                    true
                );

                return;
            }

            contactForm.style.display =
                "block";

            contactName.focus();
        }
    );
}


// ============================================================
// CANCEL CONTACT FORM
// ============================================================

if (cancelContactBtn) {

    cancelContactBtn.addEventListener(
        "click",
        () => {

            closeContactForm();
        }
    );
}


function closeContactForm() {

    contactForm.style.display =
        "none";

    contactName.value =
        "";

    contactPhone.value =
        "";

    contactRelation.value =
        "";
}


// ============================================================
// SAVE CONTACT
// ============================================================

if (saveContactBtn) {

    saveContactBtn.addEventListener(
        "click",
        saveContact
    );
}


async function saveContact() {

    const name =
        contactName.value.trim();

    const phone =
        contactPhone.value.trim();

    const relation =
        contactRelation.value.trim();

    if (!name) {

        showMessage(
            "Please enter the contact name.",
            true
        );

        contactName.focus();

        return;
    }

    if (!phone) {

        showMessage(
            "Please enter the contact phone number.",
            true
        );

        contactPhone.focus();

        return;
    }

    const contacts =
        [
            ...(currentUser.emergencyContacts ||
                [])
        ];

    if (
        contacts.length >= 5
    ) {

        showMessage(
            "Maximum of 5 emergency contacts allowed.",
            true
        );

        return;
    }

    contacts.push({
        name,
        phone,
        relation
    });

    await saveContacts(
        contacts
    );
}


// ============================================================
// DELETE CONTACT
// ============================================================

if (contactsList) {

    contactsList.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    ".contact-delete-btn"
                );

            if (!button) {
                return;
            }

            const index =
                Number(
                    button.dataset.index
                );

            const contacts =
                [
                    ...(currentUser.emergencyContacts ||
                        [])
                ];

            if (
                !contacts[index]
            ) {
                return;
            }

            const confirmed =
                window.confirm(
                    `Remove ${contacts[index].name} from your emergency contacts?`
                );

            if (!confirmed) {
                return;
            }

            contacts.splice(
                index,
                1
            );

            await saveContacts(
                contacts
            );
        }
    );
}


// ============================================================
// SAVE CONTACTS TO SERVER
// ============================================================

async function saveContacts(
    contacts
) {

    saveContactBtn.disabled =
        true;

    saveContactBtn.textContent =
        "Saving...";

    try {

        const response =
            await fetch(
                `${API_URL}/profile/emergency-contacts`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify({
                            emergencyContacts:
                                contacts
                        })
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to save contacts"
            );
        }

        currentUser.emergencyContacts =
            data.emergencyContacts ||
            [];

        localStorage.setItem(
            "resqUser",
            JSON.stringify({
                id:
                    currentUser._id ||
                    currentUser.id,

                name:
                    currentUser.name,

                email:
                    currentUser.email,

                phone:
                    currentUser.phone,

                role:
                    currentUser.role,

                emergencyContacts:
                    currentUser.emergencyContacts
            })
        );

        renderContacts(
            currentUser.emergencyContacts
        );

        closeContactForm();

        showMessage(
            "Emergency contacts updated successfully.",
            false
        );

    } catch (error) {

        console.error(
            "Save contacts error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to save emergency contacts.",
            true
        );

    } finally {

        saveContactBtn.disabled =
            false;

        saveContactBtn.textContent =
            "Save Contact";
    }
}


// ============================================================
// NOTIFICATION COUNT
// ============================================================

async function loadNotificationCount() {

    const countElement =
        document.getElementById(
            "notificationNavCount"
        );

    if (!countElement) {
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

        if (
            !response.ok ||
            !data.success
        ) {
            return;
        }

        const count =
            Number(
                data.unreadCount ||
                0
            );

        countElement.textContent =
            count;

        countElement.classList.toggle(
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
// LOGOUT
// ============================================================

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


// ============================================================
// MESSAGE
// ============================================================

function showMessage(
    message,
    isError
) {

    if (!profileMessage) {
        return;
    }

    profileMessage.textContent =
        message;

    profileMessage.className =
        isError
            ? "profile-message error"
            : "profile-message success";

    clearTimeout(
        showMessage.timer
    );

    showMessage.timer =
        setTimeout(
            () => {

                profileMessage.textContent =
                    "";

                profileMessage.className =
                    "profile-message";

            },
            4000
        );
}


// ============================================================
// HELPERS
// ============================================================

function formatRole(
    role
) {

    if (!role) {
        return "User";
    }

    return String(
        role
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
// INITIALIZE
// ============================================================

loadProfile();

loadNotificationCount();

setInterval(
    loadNotificationCount,
    10000
);