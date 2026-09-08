const express =
    require("express");

const authMiddleware =
    require("../middleware/authmiddleware");

const {

    createEmergency,

    findHelpersForEmergency,

    createHelpRequest,

    getMyEmergencies,

    getEmergencyById,

    getEmergencyTracking,

    cancelEmergency

} =
    require(
        "../controllers/emergencycontroller"
    );


const router =
    express.Router();


/* =========================================================
   CREATE EMERGENCY
========================================================= */

router.post(
    "/",
    authMiddleware,
    createEmergency
);


/* =========================================================
   FIND NEARBY HELPERS
========================================================= */

router.post(
    "/find-helpers",
    authMiddleware,
    findHelpersForEmergency
);


/* =========================================================
   CREATE HELP REQUEST
========================================================= */

router.post(
    "/help-request",
    authMiddleware,
    createHelpRequest
);


/* =========================================================
   MY EMERGENCIES
========================================================= */

router.get(
    "/my",
    authMiddleware,
    getMyEmergencies
);


/* =========================================================
   LIVE TRACKING
========================================================= */

router.get(
    "/:emergencyId/tracking",
    authMiddleware,
    getEmergencyTracking
);


/* =========================================================
   CANCEL EMERGENCY
========================================================= */

router.put(
    "/:emergencyId/cancel",
    authMiddleware,
    cancelEmergency
);


/* =========================================================
   SINGLE EMERGENCY
========================================================= */

router.get(
    "/:emergencyId",
    authMiddleware,
    getEmergencyById
);


module.exports =
    router;