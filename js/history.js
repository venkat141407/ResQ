const API_URL = "/api";

const token = localStorage.getItem("resqToken");

if (!token) {
    window.location.href = "login.html";
}

const emergencyList =
    document.getElementById("emergencyList");

const totalRequests =
    document.getElementById("totalRequests");

const activeRequests =
    document.getElementById("activeRequests");

const resolvedRequests =
    document.getElementById("resolvedRequests");


async function loadEmergencies() {

    try {

        const response = await fetch(
            `${API_URL}/emergencies/my`,
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

            showError(
                data.message ||
                "Unable to load requests."
            );

            return;
        }


        const emergencies =
            data.emergencies || [];


        // ================================
        // UPDATE SUMMARY
        // ================================

        if (totalRequests) {
            totalRequests.textContent =
                emergencies.length;
        }


        if (activeRequests) {

            activeRequests.textContent =
                emergencies.filter(
                    emergency =>
                        emergency.status !== "resolved" &&
                        emergency.status !== "cancelled"
                ).length;
        }


        if (resolvedRequests) {

            resolvedRequests.textContent =
                emergencies.filter(
                    emergency =>
                        emergency.status === "resolved"
                ).length;
        }


        // ================================
        // EMPTY STATE
        // ================================

        if (!emergencies.length) {

            emergencyList.innerHTML = `

                <div class="dashboard-card loading-card">

                    <div class="card-icon">
                        📋
                    </div>

                    <h3>
                        No emergencies yet
                    </h3>

                    <p>
                        You haven't reported any emergencies
                        through ResQ.
                    </p>

                    <br>

                    <a
                        href="emergency.html"
                        class="card-link"
                    >
                        Report an Emergency →
                    </a>

                </div>

            `;

            return;
        }


        // ================================
        // RENDER REQUESTS
        // ================================

        emergencyList.innerHTML = "";


        emergencies.forEach(
            emergency => {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "dashboard-card history-card";


                const date =
                    new Date(
                        emergency.createdAt
                    );


                const formattedType =
                    emergency.type
                        .replace(/_/g, " ")
                        .toUpperCase();


                const formattedStatus =
                    emergency.status
                        .replace(/_/g, " ")
                        .toUpperCase();


                const formattedPriority =
                    emergency.priority
                        .replace(/_/g, " ")
                        .toUpperCase();


                card.innerHTML = `

                    <div class="history-top">

                        <div>

                            <span class="section-label">
                                ${formattedType}
                            </span>

                            <h3>
                                ${emergency.description}
                            </h3>

                        </div>


                        <span
                            class="status-badge ${emergency.status}"
                        >
                            ${formattedStatus}
                        </span>

                    </div>


                    <div class="history-details">

                        <div>

                            <small>
                                Priority
                            </small>

                            <strong>
                                ${formattedPriority}
                            </strong>

                        </div>


                        <div>

                            <small>
                                Reported
                            </small>

                            <strong>
                                ${date.toLocaleString()}
                            </strong>

                        </div>


                        <div>

                            <small>
                                Location
                            </small>

                            <strong>
                                ${Number(
                                    emergency.location.latitude
                                ).toFixed(5)},
                                ${Number(
                                    emergency.location.longitude
                                ).toFixed(5)}
                            </strong>

                        </div>

                    </div>


                    <div class="history-actions">

                        <a
                            href="tracking.html?id=${emergency._id}"
                            class="card-link"
                        >
                            Track Emergency →
                        </a>

                    </div>

                `;


                emergencyList.appendChild(
                    card
                );

            }
        );


    } catch (error) {

        console.error(
            "History error:",
            error
        );

        showError(
            "Unable to connect to ResQ server."
        );
    }
}


// =====================================================
// ERROR DISPLAY
// =====================================================

function showError(message) {

    emergencyList.innerHTML = `

        <div class="dashboard-card loading-card">

            <div class="card-icon">
                ⚠️
            </div>

            <h3>
                Unable to load requests
            </h3>

            <p>
                ${message}
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
// START
// =====================================================

loadEmergencies();