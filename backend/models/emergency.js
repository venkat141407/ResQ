const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: [
                "medical",
                "accident",
                "fire",
                "crime",
                "blood",
                "other"
            ],
            required: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        location: {
            latitude: {
                type: Number,
                required: true
            },
            longitude: {
                type: Number,
                required: true
            },
            address: {
                type: String,
                default: ""
            }
        },

        status: {
            type: String,
            enum: [
                "pending",
                "matched",
                "accepted",
                "in_progress",
                "resolved",
                "cancelled"
            ],
            default: "pending"
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "high"
        },

        assignedHelper: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Emergency", emergencySchema);
