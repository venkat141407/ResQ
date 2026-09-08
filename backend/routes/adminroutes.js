const express =
    require("express");

const authMiddleware =
    require("../middleware/authmiddleware");

const adminMiddleware =
    require("../middleware/adminmiddleware");

const {
    getHelpers,
    verifyHelper,
    rejectHelper,
    getEmergencies,
    getEmergencyDetails,
    updateEmergencyStatus,
    getUsers
} =
    require("../controllers/admincontroller");


const router =
    express.Router();


// ============================================================
// ADMIN-ONLY ROUTES
// ============================================================

router.use(
    authMiddleware,
    adminMiddleware
);


// ============================================================
// RESPONDER MANAGEMENT
// ============================================================

router.get(
    "/helpers",
    getHelpers
);

router.put(
    "/helpers/:helperId/verify",
    verifyHelper
);

router.put(
    "/helpers/:helperId/reject",
    rejectHelper
);


// ============================================================
// EMERGENCY MANAGEMENT
// ============================================================

router.get(
    "/emergencies",
    getEmergencies
);

router.get(
    "/emergencies/:emergencyId",
    getEmergencyDetails
);

router.put(
    "/emergencies/:emergencyId/status",
    updateEmergencyStatus
);


// ============================================================
// USER MANAGEMENT
// ============================================================

router.get(
    "/users",
    getUsers
);


module.exports =
    router;