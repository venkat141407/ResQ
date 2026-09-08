const User = require("../models/user");
const Helper = require("../models/helper");
const Emergency = require("../models/emergency");
const HelpRequest = require("../models/helprequest");

const {
    createNotification
} = require("../utils/notifications");

/* =========================================================
   GET ALL HELPERS
========================================================= */

const getHelpers = async (req, res) => {
    try {
        const helpers = await Helper.find()
            .populate(
                "user",
                "name email phone role"
            )
            .sort({
                createdAt: -1
            });

        res.json({
            success: true,
            count: helpers.length,
            helpers
        });

    } catch (error) {
        console.error(
            "Get helpers error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while fetching helpers"
        });
    }
};

/* =========================================================
   VERIFY HELPER
========================================================= */

const verifyHelper = async (req, res) => {
    try {
        const { helperId } =
            req.params;

        const helper =
            await Helper.findById(
                helperId
            );

        if (!helper) {
            return res.status(404).json({
                success: false,
                message:
                    "Responder not found"
            });
        }

        helper.verificationStatus =
            "verified";

        await helper.save();

        await createNotification({
            recipient: helper.user,
            type: "system",
            title:
                "Responder Account Verified",
            message:
                "Your ResQ responder application has been verified. You can now receive and accept nearby emergency requests."
        });

        res.json({
            success: true,
            message:
                "Responder verified successfully",
            helper
        });

    } catch (error) {
        console.error(
            "Verify helper error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while verifying responder"
        });
    }
};

/* =========================================================
   REJECT HELPER
========================================================= */

const rejectHelper = async (req, res) => {
    try {
        const { helperId } =
            req.params;

        const helper =
            await Helper.findById(
                helperId
            );

        if (!helper) {
            return res.status(404).json({
                success: false,
                message:
                    "Responder not found"
            });
        }

        helper.verificationStatus =
            "rejected";

        helper.isAvailable =
            false;

        await helper.save();

        await createNotification({
            recipient: helper.user,
            type: "system",
            title:
                "Responder Application Rejected",
            message:
                "Your ResQ responder application was not approved by the administrator. Please contact ResQ support if you believe this was a mistake."
        });

        res.json({
            success: true,
            message:
                "Responder application rejected",
            helper
        });

    } catch (error) {
        console.error(
            "Reject helper error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while rejecting responder"
        });
    }
};

/* =========================================================
   GET ALL EMERGENCIES
========================================================= */

const getEmergencies = async (req, res) => {
    try {
        const emergencies =
            await Emergency.find()
                .populate(
                    "user",
                    "name email phone"
                )
                .populate(
                    "assignedHelper",
                    "name email phone"
                )
                .sort({
                    createdAt: -1
                });

        res.json({
            success: true,
            count: emergencies.length,
            emergencies
        });

    } catch (error) {
        console.error(
            "Get emergencies error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while fetching emergencies"
        });
    }
};

/* =========================================================
   GET SINGLE EMERGENCY
========================================================= */

const getEmergencyDetails = async (
    req,
    res
) => {
    try {
        const emergency =
            await Emergency.findById(
                req.params.emergencyId
            )
            .populate(
                "user",
                "name email phone"
            )
            .populate(
                "assignedHelper",
                "name email phone"
            );

        if (!emergency) {
            return res.status(404).json({
                success: false,
                message:
                    "Emergency not found"
            });
        }

        const helpRequests =
            await HelpRequest.find({
                emergency:
                    emergency._id
            })
            .populate(
                "requester",
                "name email phone"
            )
            .populate(
                "helper",
                "name email phone"
            )
            .sort({
                createdAt: -1
            });

        res.json({
            success: true,
            emergency,
            helpRequests
        });

    } catch (error) {
        console.error(
            "Get emergency details error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while fetching emergency details"
        });
    }
};

/* =========================================================
   UPDATE EMERGENCY STATUS BY ADMIN
========================================================= */

const updateEmergencyStatus =
    async (req, res) => {
        try {

            const {
                emergencyId
            } = req.params;

            const {
                status
            } = req.body;

            const allowedStatuses = [
                "pending",
                "matched",
                "accepted",
                "in_progress",
                "resolved",
                "cancelled"
            ];

            if (
                !allowedStatuses.includes(
                    status
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid emergency status"
                });
            }

            const emergency =
                await Emergency.findById(
                    emergencyId
                );

            if (!emergency) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Emergency not found"
                });
            }

            const previousStatus =
                emergency.status;

            /*
                Admin has elevated authority,
                so the admin can correct or
                close an emergency when required.
            */

            emergency.status =
                status;

            /*
                If admin cancels or resolves
                an emergency, remove active
                assignment.
            */

            if (
                status === "cancelled" ||
                status === "resolved"
            ) {

                if (
                    emergency.assignedHelper
                ) {

                    const helper =
                        await Helper.findOne({
                            user:
                                emergency.assignedHelper
                        });

                    if (helper) {

                        helper.isAvailable =
                            true;

                        if (
                            status ===
                            "resolved"
                        ) {
                            helper.completedRequests +=
                                1;
                        }

                        await helper.save();
                    }
                }
            }

            await emergency.save();

            /*
                Keep related help requests
                synchronized.
            */

            if (
                status === "resolved"
            ) {

                await HelpRequest.updateMany(
                    {
                        emergency:
                            emergencyId,

                        status: {
                            $in: [
                                "requested",
                                "matched",
                                "accepted"
                            ]
                        }
                    },
                    {
                        status:
                            "completed"
                    }
                );
            }

            if (
                status === "cancelled"
            ) {

                await HelpRequest.updateMany(
                    {
                        emergency:
                            emergencyId,

                        status: {
                            $in: [
                                "requested",
                                "matched",
                                "accepted"
                            ]
                        }
                    },
                    {
                        status:
                            "cancelled"
                    }
                );
            }

            /*
                Notify emergency owner.
            */

            await createNotification({
                recipient:
                    emergency.user,

                type:
                    status ===
                    "cancelled"
                        ? "system"
                        : "completed",

                title:
                    status ===
                    "cancelled"
                        ? "Emergency Cancelled"
                        : "Emergency Status Updated",

                message:
                    `An administrator updated your emergency status from ${previousStatus.replace(
                        /_/g,
                        " "
                    )} to ${status.replace(
                        /_/g,
                        " "
                    )}.`,

                emergency:
                    emergency._id
            });

            /*
                Notify assigned responder
                when one exists.
            */

            if (
                emergency.assignedHelper
            ) {

                await createNotification({
                    recipient:
                        emergency.assignedHelper,

                    type:
                        "system",

                    title:
                        "Emergency Updated by Admin",

                    message:
                        `An administrator changed the emergency status to ${status.replace(
                            /_/g,
                            " "
                        )}.`,

                    emergency:
                        emergency._id
                });
            }

            const updatedEmergency =
                await Emergency.findById(
                    emergency._id
                )
                .populate(
                    "user",
                    "name email phone"
                )
                .populate(
                    "assignedHelper",
                    "name email phone"
                );

            res.json({
                success: true,
                message:
                    "Emergency status updated successfully",
                emergency:
                    updatedEmergency
            });

        } catch (error) {

            console.error(
                "Admin emergency status error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Server error while updating emergency"
            });
        }
    };

/* =========================================================
   GET ALL USERS
========================================================= */

const getUsers = async (req, res) => {
    try {

        const users =
            await User.find()
                .select("-password")
                .sort({
                    createdAt: -1
                });

        res.json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {

        console.error(
            "Get users error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while fetching users"
        });
    }
};

/* =========================================================
   EXPORT
========================================================= */

module.exports = {

    getHelpers,

    verifyHelper,

    rejectHelper,

    getEmergencies,

    getEmergencyDetails,

    updateEmergencyStatus,

    getUsers
};
