const Notification =
    require("../models/notification");


// =====================================================
// CREATE NOTIFICATION
// =====================================================

const createNotification = async ({
    recipient,
    type,
    title,
    message,
    emergency = null
}) => {

    try {

        if (!recipient) {

            return null;

        }


        const notification =
            await Notification.create({

                recipient,

                type:

                    type ||
                    "system",

                title,

                message,

                emergency

            });


        return notification;


    } catch (error) {

        console.error(
            "Create notification error:",
            error
        );


        return null;

    }

};


module.exports = {
    createNotification
};