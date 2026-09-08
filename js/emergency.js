const API_URL = "/api";

const token = localStorage.getItem("resqToken");
const userData = localStorage.getItem("resqUser");


// ============================================================
// AUTHENTICATION
// ============================================================

if (!token || !userData) {
    window.location.href = "/frontend/login.html";
}


// ============================================================
// ELEMENTS
// ============================================================

const emergencyForm =
    document.getElementById("emergencyForm");

const locationButton =
    document.getElementById("locationBtn");

const latitudeInput =
    document.getElementById("latitude");

const longitudeInput =
    document.getElementById("longitude");

const locationStatus =
    document.getElementById("locationStatus");

const emergencyMessage =
    document.getElementById("emergencyMessage");

const submitButton =
    emergencyForm?.querySelector(
        'button[type="submit"]'
    );

const logoutBtn =
    document.getElementById("logoutBtn");


// ============================================================
// LOCATION STATE
// ============================================================

let currentLatitude = null;
let currentLongitude = null;

let locationRequestInProgress = false;
let emergencySubmissionInProgress = false;


// ============================================================
// GET CURRENT LOCATION
// ============================================================

function getCurrentLocation() {

    if (locationRequestInProgress) {
        return;
    }

    if (!navigator.geolocation) {

        showLocationStatus(
            "❌ Geolocation is not supported by this browser.",
            "error"
        );

        return;
    }


    locationRequestInProgress = true;


    if (locationButton) {

        locationButton.disabled = true;

        locationButton.textContent =
            "📍 Detecting location...";

    }


    showLocationStatus(
        "Getting your current location...",
        "loading"
    );


    navigator.geolocation.getCurrentPosition(

        position => {

            const latitude =
                Number(position.coords.latitude);

            const longitude =
                Number(position.coords.longitude);


            if (
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude)
            ) {

                showLocationStatus(
                    "❌ Unable to read a valid GPS location.",
                    "error"
                );

                finishLocationRequest();

                return;
            }


            currentLatitude =
                latitude;

            currentLongitude =
                longitude;


            // Store GPS coordinates
            if (latitudeInput) {

                latitudeInput.value =
                    latitude.toFixed(6);

            }


            if (longitudeInput) {

                longitudeInput.value =
                    longitude.toFixed(6);

            }


            console.log(
                "📍 Current GPS location:",
                latitude,
                longitude
            );


            showLocationStatus(

                `📍 Location detected successfully — ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,

                "success"

            );


            finishLocationRequest();

        },


        error => {

            console.error(
                "Geolocation error:",
                error
            );


            let message =
                "Unable to get your location.";


            if (
                error.code ===
                error.PERMISSION_DENIED
            ) {

                message =
                    "Location permission was denied. Please allow location access in your browser and try again.";

            } else if (
                error.code ===
                error.POSITION_UNAVAILABLE
            ) {

                message =
                    "Your location is currently unavailable. Please check your device GPS/location services.";

            } else if (
                error.code ===
                error.TIMEOUT
            ) {

                message =
                    "Location request timed out. Please try again.";

            }


            showLocationStatus(
                "⚠️ " + message,
                "error"
            );


            finishLocationRequest();

        },


        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }

    );
}


// ============================================================
// FINISH LOCATION REQUEST
// ============================================================

function finishLocationRequest() {

    locationRequestInProgress =
        false;


    if (locationButton) {

        locationButton.disabled =
            false;

        locationButton.textContent =
            "📍 Get My Location";

    }

}


// ============================================================
// LOCATION BUTTON
// ============================================================

if (locationButton) {

    locationButton.addEventListener(
        "click",
        getCurrentLocation
    );

}


// ============================================================
// FORM SUBMISSION
// ============================================================

if (emergencyForm) {

    emergencyForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                emergencySubmissionInProgress
            ) {

                return;

            }


            const type =
                document.getElementById(
                    "type"
                )?.value;


            const description =
                document.getElementById(
                    "description"
                )?.value.trim();


            const priority =
                document.getElementById(
                    "priority"
                )?.value || "high";


            // ====================================================
            // VALIDATION
            // ====================================================

            if (!type) {

                showMessage(
                    "Please select an emergency type.",
                    true
                );

                return;

            }


            if (
                !description ||
                description.length < 5
            ) {

                showMessage(
                    "Please describe the emergency using at least 5 characters.",
                    true
                );

                return;

            }


            if (
                description.length > 1000
            ) {

                showMessage(
                    "Emergency description cannot exceed 1000 characters.",
                    true
                );

                return;

            }


            // ====================================================
            // LOCATION CHECK
            // ====================================================

            const latitude =
                Number(
                    latitudeInput?.value
                );

            const longitude =
                Number(
                    longitudeInput?.value
                );


            if (
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude)
            ) {

                showMessage(
                    "Please capture your current location before reporting the emergency.",
                    true
                );


                // Automatically request location
                getCurrentLocation();


                return;

            }


            if (
                latitude < -90 ||
                latitude > 90 ||
                longitude < -180 ||
                longitude > 180
            ) {

                showMessage(
                    "The selected location is invalid.",
                    true
                );

                return;

            }


            // ====================================================
            // SUBMIT
            // ====================================================

            emergencySubmissionInProgress =
                true;


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "🚨 Reporting Emergency...";

            }


            showMessage(
                "Submitting your emergency to the ResQ network...",
                false
            );


            try {

                const response =
                    await fetch(
                        `${API_URL}/emergencies`,
                        {
                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`

                            },

                            body:
                                JSON.stringify({

                                    type,

                                    description,

                                    latitude,

                                    longitude,

                                    priority

                                })

                        }
                    );


                const data =
                    await response.json();


                console.log(
                    "Emergency response:",
                    data
                );


                // ====================================================
                // API ERROR
                // ====================================================

                if (
                    !response.ok ||
                    !data.success
                ) {

                    if (
                        data.emergencyId
                    ) {

                        const goToExisting =
                            window.confirm(

                                `${data.message}\n\nWould you like to track your existing emergency?`

                            );


                        if (
                            goToExisting
                        ) {

                            window.location.href =
                                `tracking.html?id=${encodeURIComponent(
                                    data.emergencyId
                                )}`;

                        }

                    } else {

                        showMessage(
                            data.message ||
                            "Unable to report emergency.",
                            true
                        );

                    }


                    return;

                }


                // ====================================================
                // SUCCESS
                // ====================================================

                const emergency =
                    data.emergency;


                showMessage(
                    "Emergency reported successfully. Opening live tracking...",
                    false
                );


                if (
                    emergency?._id
                ) {

                    setTimeout(
                        () => {

                            window.location.href =
                                `tracking.html?id=${encodeURIComponent(
                                    emergency._id
                                )}`;

                        },
                        700
                    );

                } else {

                    setTimeout(
                        () => {

                            window.location.href =
                                "history.html";

                        },
                        700
                    );

                }


            } catch (error) {

                console.error(
                    "Emergency submission error:",
                    error
                );


                showMessage(
                    "Unable to connect to the ResQ server. Please make sure the backend is running.",
                    true
                );


            } finally {

                emergencySubmissionInProgress =
                    false;


                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "🚨 Report Emergency";

                }

            }

        }

    );

}


// ============================================================
// LOGOUT
// ============================================================

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

    if (!emergencyMessage) {
        return;
    }


    emergencyMessage.textContent =
        message;


    emergencyMessage.className =
        isError
            ? "form-message error"
            : "form-message success";

}


// ============================================================
// LOCATION STATUS
// ============================================================

function showLocationStatus(
    message,
    type
) {

    if (!locationStatus) {
        return;
    }


    locationStatus.textContent =
        message;


    locationStatus.className =
        `location-status ${type}`;

}