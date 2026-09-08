const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: [
                "emergency",
                "help_request",
                "match",
                "accepted",
                "completed",
                "system"
            ],
            default: "system"
        },

        title: {
            type: String,
            required: true
        },

        message: {
            type: String,
            required: true
        },

        emergency: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Emergency",
            default: null
        },

        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Notification", notificationSchema);