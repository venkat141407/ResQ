const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: [
                "user",
                "helper",
                "admin"
            ],
            default: "user"
        },

        emergencyContacts: [
            {
                name: {
                    type: String,
                    trim: true,
                    maxlength: 100
                },

                phone: {
                    type: String,
                    trim: true,
                    maxlength: 30
                },

                relation: {
                    type: String,
                    trim: true,
                    maxlength: 50
                }
            }
        ]
    },

    {
        timestamps: true
    }
);

module.exports =
    mongoose.model(
        "User",
        userSchema
    );