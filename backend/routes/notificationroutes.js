const express = require("express");

const authMiddleware =
    require("../middleware/authmiddleware");


const {

    getMyNotifications,

    getUnreadCount,

    markNotificationAsRead,

    markAllNotificationsAsRead

} = require(
    "../controllers/notificationcontroller"
);


const router =
    express.Router();


/*
    All notification routes
    require authentication.
*/

router.use(
    authMiddleware
);


// GET ALL NOTIFICATIONS

router.get(
    "/",
    getMyNotifications
);


// GET UNREAD COUNT

router.get(
    "/unread-count",
    getUnreadCount
);


// MARK ALL AS READ

router.put(
    "/read-all",
    markAllNotificationsAsRead
);


// MARK ONE AS READ

router.put(
    "/:notificationId/read",
    markNotificationAsRead
);


module.exports =
    router;