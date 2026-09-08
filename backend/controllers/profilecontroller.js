const User = require("../models/user");


// ============================================================
// GET MY PROFILE
// ============================================================

const getMyProfile = async (
    req,
    res
) => {

    try {

        const user =
            await User.findById(
                req.user.id
            ).select(
                "-password"
            );

        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "User profile not found"
            });
        }

        res.json({
            success: true,
            user
        });

    } catch (error) {

        console.error(
            "Get profile error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while loading profile"
        });
    }
};


// ============================================================
// UPDATE EMERGENCY CONTACTS
// ============================================================

const updateEmergencyContacts =
    async (
        req,
        res
    ) => {

        try {

            const {
                emergencyContacts
            } = req.body;

            if (
                !Array.isArray(
                    emergencyContacts
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Emergency contacts must be an array"
                });
            }

            if (
                emergencyContacts.length >
                5
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "You can add a maximum of 5 emergency contacts"
                });
            }

            const cleanedContacts =
                emergencyContacts
                    .map(
                        contact => ({

                            name:
                                String(
                                    contact.name ||
                                    ""
                                ).trim(),

                            phone:
                                String(
                                    contact.phone ||
                                    ""
                                ).trim(),

                            relation:
                                String(
                                    contact.relation ||
                                    ""
                                ).trim()
                        })
                    )
                    .filter(
                        contact =>
                            contact.name &&
                            contact.phone
                    );

            for (
                const contact
                of cleanedContacts
            ) {

                if (
                    contact.name.length >
                    100
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Contact name is too long"
                    });
                }

                if (
                    contact.phone.length >
                    30
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Contact phone number is too long"
                    });
                }

                if (
                    contact.relation.length >
                    50
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Contact relation is too long"
                    });
                }
            }

            const user =
                await User.findByIdAndUpdate(
                    req.user.id,

                    {
                        emergencyContacts:
                            cleanedContacts
                    },

                    {
                        new: true,
                        runValidators: true
                    }
                ).select(
                    "-password"
                );

            if (!user) {

                return res.status(404).json({
                    success: false,
                    message:
                        "User profile not found"
                });
            }

            res.json({
                success: true,
                message:
                    "Emergency contacts updated successfully",
                emergencyContacts:
                    user.emergencyContacts
            });

        } catch (error) {

            console.error(
                "Update emergency contacts error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Server error while updating emergency contacts"
            });
        }
    };


module.exports = {
    getMyProfile,
    updateEmergencyContacts
};