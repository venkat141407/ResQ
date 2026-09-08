const Notification = require("../models/notification");


// =====================================================
// GET MY NOTIFICATIONS
// =====================================================

const getMyNotifications = async (req, res) => {

    try {

        const notifications =
            await Notification.find({
                recipient: req.user.id
            })
            .populate(
                "emergency",
                "type status priority"
            )
            .sort({
                createdAt: -1
            })
            .limit(50);


        const unreadCount =
            await Notification.countDocuments({
                recipient: req.user.id,
                isRead: false
            });


        res.json({

            success: true,

            count: notifications.length,

            unreadCount,

            notifications

        });


    } catch (error) {

        console.error(
            "Get notifications error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Server error while fetching notifications"

        });

    }

};


// =====================================================
// GET UNREAD COUNT
// =====================================================

const getUnreadCount = async (req, res) => {

    try {

        const unreadCount =
            await Notification.countDocuments({

                recipient: req.user.id,

                isRead: false

            });


        res.json({

            success: true,

            unreadCount

        });


    } catch (error) {

        console.error(
            "Unread notification error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Server error while checking notifications"

        });

    }

};


// =====================================================
// MARK ONE NOTIFICATION AS READ
// =====================================================

const markNotificationAsRead = async (
    req,
    res
) => {

    try {

        const notification =
            await Notification.findOneAndUpdate(

                {
                    _id:
                        req.params.notificationId,

                    recipient:
                        req.user.id
                },

                {
                    isRead: true
                },

                {
                    new: true
                }

            );


        if (!notification) {

            return res.status(404).json({

                success: false,

                message:
                    "Notification not found"

            });

        }


        res.json({

            success: true,

            message:
                "Notification marked as read",

            notification

        });


    } catch (error) {

        console.error(
            "Mark notification error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Server error while updating notification"

        });

    }

};


// =====================================================
// MARK ALL AS READ
// =====================================================

const markAllNotificationsAsRead = async (
    req,
    res
) => {

    try {

        await Notification.updateMany(

            {
                recipient:
                    req.user.id,

                isRead: false
            },

            {
                isRead: true
            }

        );


        res.json({

            success: true,

            message:
                "All notifications marked as read"

        });


    } catch (error) {

        console.error(
            "Mark all notifications error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Server error while updating notifications"

        });

    }

};


module.exports = {

    getMyNotifications,

    getUnreadCount,

    markNotificationAsRead,

    markAllNotificationsAsRead

};