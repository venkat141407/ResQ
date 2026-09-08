const express =
    require("express");

const authMiddleware =
    require("../middleware/authmiddleware");

const {
    getMyProfile,
    updateEmergencyContacts
} =
    require("../controllers/profilecontroller");

const router =
    express.Router();


// All profile routes require login.
router.use(
    authMiddleware
);


// GET PROFILE
router.get(
    "/",
    getMyProfile
);


// UPDATE EMERGENCY CONTACTS
router.put(
    "/emergency-contacts",
    updateEmergencyContacts
);


module.exports =
    router;