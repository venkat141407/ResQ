const mongoose = require("mongoose");

const helperSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        helpTypes: [
            {
                type: String,
                enum: [
                    "first_aid",
                    "transport",
                    "blood",
                    "medicine",
                    "shelter",
                    "other"
                ]
            }
        ],

        location: {
            latitude: {
                type: Number,
                required: true
            },

            longitude: {
                type: Number,
                required: true
            }
        },

        isAvailable: {
            type: Boolean,
            default: false
        },

        verificationStatus: {
            type: String,
            enum: [
                "pending",
                "verified",
                "rejected"
            ],
            default: "pending"
        },

        rating: {
            type: Number,
            default: 5
        },

        completedRequests: {
            type: Number,
            default: 0
        },

        lastLocationUpdate: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.model(
        "Helper",
        helperSchema
    );