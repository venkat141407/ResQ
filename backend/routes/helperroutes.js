const express = require("express");

const authMiddleware =
    require("../middleware/authmiddleware");

const helperMiddleware =
    require("../middleware/helpermiddleware");

const {
    registerResponder,
    createHelperProfile,
    getMyHelperProfile,
    updateAvailability,
    updateLocation,
    getResponderLocation,
    getResponderRequests,
    acceptEmergency,
    updateEmergencyStatus
} =
    require("../controllers/helpercontroller");

const router =
    express.Router();


// ============================================================
// PUBLIC RESPONDER REGISTRATION
// ============================================================

router.post(
    "/register",
    registerResponder
);


// ============================================================
// RESPONDER-ONLY ROUTES
// ============================================================

router.use(
    authMiddleware,
    helperMiddleware
);


// ============================================================
// RESPONDER PROFILE
// ============================================================

router.post(
    "/profile",
    createHelperProfile
);

router.get(
    "/profile",
    getMyHelperProfile
);


// ============================================================
// RESPONDER AVAILABILITY
// ============================================================

router.put(
    "/availability",
    updateAvailability
);


// ============================================================
// RESPONDER GPS
// ============================================================

router.put(
    "/location",
    updateLocation
);

router.get(
    "/location",
    getResponderLocation
);


// ============================================================
// RESPONDER EMERGENCY REQUESTS
// ============================================================

router.get(
    "/requests",
    getResponderRequests
);

router.put(
    "/emergency/:emergencyId/accept",
    acceptEmergency
);

router.put(
    "/emergency/:emergencyId/status",
    updateEmergencyStatus
);


module.exports = router;