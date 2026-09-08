const mongoose = require("mongoose");

const helpRequestSchema = new mongoose.Schema(
    {
        emergency: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Emergency",
            required: true
        },

        requester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        helper: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        helpType: {
            type: String,
            enum: [
                "first_aid",
                "transport",
                "blood",
                "medicine",
                "shelter",
                "other"
            ],
            required: true
        },

        status: {
            type: String,
            enum: [
                "requested",
                "matched",
                "accepted",
                "completed",
                "cancelled"
            ],
            default: "requested"
        },

        distance: {
            type: Number,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("HelpRequest", helpRequestSchema);