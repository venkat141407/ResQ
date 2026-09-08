const Helper = require("../models/helper");
const User = require("../models/user");
const HelpRequest = require("../models/helprequest");
const Emergency = require("../models/emergency");

const {
    createNotification
} = require("../utils/notifications");


// ============================================================
// RESPONDER REGISTRATION
// ============================================================

const registerResponder = async (req, res) => {
    try {

        const {
            name,
            email,
            phone,
            password,
            helpTypes,
            latitude,
            longitude
        } = req.body;

        if (
            !name ||
            !email ||
            !phone ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please fill all required fields"
            });
        }

        const existingUser =
            await User.findOne({
                email
            });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message:
                    "An account with this email already exists"
            });
        }

        const bcrypt =
            require("bcryptjs");

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        const user =
            await User.create({
                name,
                email,
                phone,
                password:
                    hashedPassword,
                role: "helper"
            });

        const helper =
            await Helper.create({
                user: user._id,
                helpTypes:
                    Array.isArray(helpTypes)
                        ? helpTypes
                        : [],
                location: {
                    latitude:
                        Number(latitude) || 0,
                    longitude:
                        Number(longitude) || 0
                },
                isAvailable: false,
                verificationStatus:
                    "pending",
                lastLocationUpdate:
                    latitude !== undefined &&
                    longitude !== undefined
                        ? new Date()
                        : null
            });

        res.status(201).json({
            success: true,
            message:
                "Responder registration submitted. Awaiting admin verification.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            },
            helper
        });

    } catch (error) {

        console.error(
            "Responder registration error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error during responder registration"
        });
    }
};


// ============================================================
// CREATE / UPDATE HELPER PROFILE
// ============================================================

const createHelperProfile = async (
    req,
    res
) => {

    try {

        const {
            helpTypes,
            latitude,
            longitude
        } = req.body;

        let helper =
            await Helper.findOne({
                user: req.user.id
            });

        if (!helper) {

            helper =
                await Helper.create({
                    user: req.user.id,
                    helpTypes:
                        Array.isArray(helpTypes)
                            ? helpTypes
                            : [],
                    location: {
                        latitude:
                            Number(latitude) || 0,
                        longitude:
                            Number(longitude) || 0
                    },
                    verificationStatus:
                        "pending"
                });

        } else {

            if (
                Array.isArray(
                    helpTypes
                )
            ) {
                helper.helpTypes =
                    helpTypes;
            }

            if (
                latitude !== undefined &&
                longitude !== undefined
            ) {

                helper.location = {
                    latitude:
                        Number(latitude),
                    longitude:
                        Number(longitude)
                };

                helper.lastLocationUpdate =
                    new Date();
            }

            await helper.save();
        }

        res.json({
            success: true,
            message:
                "Responder profile saved",
            helper
        });

    } catch (error) {

        console.error(
            "Create helper profile error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while saving responder profile"
        });
    }
};


// ============================================================
// GET MY HELPER PROFILE
// ============================================================

const getMyHelperProfile = async (
    req,
    res
) => {

    try {

        const helper =
            await Helper.findOne({
                user: req.user.id
            })
            .populate(
                "user",
                "name email phone role"
            );

        if (!helper) {

            return res.status(404).json({
                success: false,
                message:
                    "Responder profile not found"
            });
        }

        res.json({
            success: true,
            helper
        });

    } catch (error) {

        console.error(
            "Get helper profile error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while fetching responder profile"
        });
    }
};


// ============================================================
// UPDATE AVAILABILITY
// ============================================================

const updateAvailability = async (
    req,
    res
) => {

    try {

        const {
            isAvailable
        } = req.body;

        if (
            typeof isAvailable !==
            "boolean"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "isAvailable must be true or false"
            });
        }

        const helper =
            await Helper.findOne({
                user: req.user.id
            });

        if (!helper) {

            return res.status(404).json({
                success: false,
                message:
                    "Responder profile not found"
            });
        }

        if (
            helper.verificationStatus !==
            "verified"
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "Responder must be verified before becoming available"
            });
        }

        helper.isAvailable =
            isAvailable;

        if (!isAvailable) {
            helper.lastLocationUpdate =
                helper.lastLocationUpdate;
        }

        await helper.save();

        res.json({
            success: true,
            message:
                isAvailable
                    ? "You are now available"
                    : "You are now unavailable",
            helper
        });

    } catch (error) {

        console.error(
            "Availability update error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while updating availability"
        });
    }
};


// ============================================================
// UPDATE GPS LOCATION
// ============================================================

const updateLocation = async (
    req,
    res
) => {

    try {

        const {
            latitude,
            longitude
        } = req.body;

        const lat =
            Number(latitude);

        const lon =
            Number(longitude);

        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lon)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Valid latitude and longitude are required"
            });
        }

        // Valid geographic bounds.
        if (
            lat < -90 ||
            lat > 90 ||
            lon < -180 ||
            lon > 180
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid geographic coordinates"
            });
        }

        const helper =
            await Helper.findOne({
                user: req.user.id
            });

        if (!helper) {

            return res.status(404).json({
                success: false,
                message:
                    "Responder profile not found"
            });
        }

        if (
            helper.verificationStatus !==
            "verified"
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "Only verified responders can share live location"
            });
        }

        if (!helper.isAvailable) {

            return res.status(403).json({
                success: false,
                message:
                    "Set your responder status to available before sharing location"
            });
        }

        helper.location = {
            latitude: lat,
            longitude: lon
        };

        helper.lastLocationUpdate =
            new Date();

        await helper.save();

        res.json({
            success: true,
            message:
                "Location updated successfully",

            location: {
                latitude: lat,
                longitude: lon
            },

            lastLocationUpdate:
                helper.lastLocationUpdate
        });

    } catch (error) {

        console.error(
            "Update location error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while updating location"
        });
    }
};


// ============================================================
// GET RESPONDER LOCATION
// ============================================================

const getResponderLocation = async (
    req,
    res
) => {

    try {

        const helper =
            await Helper.findOne({
                user: req.user.id
            });

        if (!helper) {

            return res.status(404).json({
                success: false,
                message:
                    "Responder profile not found"
            });
        }

        res.json({
            success: true,

            location: {
                latitude:
                    helper.location.latitude,

                longitude:
                    helper.location.longitude
            },

            isAvailable:
                helper.isAvailable,

            verificationStatus:
                helper.verificationStatus,

            lastLocationUpdate:
                helper.lastLocationUpdate
        });

    } catch (error) {

        console.error(
            "Get responder location error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while fetching responder location"
        });
    }
};


// ============================================================
// GET RESPONDER REQUESTS
// ============================================================

const getResponderRequests = async (
    req,
    res
) => {

    try {

        const requests =
            await HelpRequest.find({
                helper: req.user.id
            })
            .populate(
                "requester",
                "name email phone"
            )
            .populate(
                "emergency"
            )
            .sort({
                createdAt: -1
            });

        res.json({
            success: true,
            count: requests.length,
            requests
        });

    } catch (error) {

        console.error(
            "Get responder requests error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while fetching responder requests"
        });
    }
};


// ============================================================
// ACCEPT EMERGENCY
// ============================================================

const acceptEmergency = async (
    req,
    res
) => {

    try {

        const helper =
            await Helper.findOne({
                user: req.user.id
            });

        if (!helper) {

            return res.status(404).json({
                success: false,
                message:
                    "Responder profile not found"
            });
        }

        if (
            helper.verificationStatus !==
            "verified"
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "Responder verification required"
            });
        }

        if (!helper.isAvailable) {

            return res.status(400).json({
                success: false,
                message:
                    "You are currently unavailable"
            });
        }

        const emergency =
            await Emergency.findOne({
                _id:
                    req.params.emergencyId
            });

        if (!emergency) {

            return res.status(404).json({
                success: false,
                message:
                    "Emergency not found"
            });
        }

        if (
            [
                "resolved",
                "cancelled"
            ].includes(
                emergency.status
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "This emergency is no longer active"
            });
        }

        const helpRequest =
            await HelpRequest.findOne({
                emergency:
                    emergency._id,
                helper:
                    req.user.id,
                status: {
                    $in: [
                        "requested",
                        "matched"
                    ]
                }
            });

        if (!helpRequest) {

            return res.status(404).json({
                success: false,
                message:
                    "No active request assigned to you"
            });
        }

        // Prevent accepting an emergency
        // that another responder already accepted.
        if (
            emergency.assignedHelper &&
            String(
                emergency.assignedHelper
            ) !==
            String(req.user.id)
        ) {

            return res.status(409).json({
                success: false,
                message:
                    "This emergency has already been assigned to another responder"
            });
        }

        emergency.assignedHelper =
            req.user.id;

        emergency.status =
            "accepted";

        await emergency.save();

        helpRequest.status =
            "accepted";

        await helpRequest.save();

        // Once accepted, responder is busy.
        helper.isAvailable =
            false;

        await helper.save();

        await createNotification({
            recipient:
                emergency.user,
            type: "accepted",
            title:
                "Responder Accepted Your Emergency",
            message:
                "A verified responder has accepted your emergency request.",
            emergency:
                emergency._id
        });

        await createNotification({
            recipient:
                req.user.id,
            type: "accepted",
            title:
                "Emergency Accepted",
            message:
                "You have accepted this emergency request.",
            emergency:
                emergency._id
        });

        res.json({
            success: true,
            message:
                "Emergency accepted successfully",
            emergency,
            helpRequest
        });

    } catch (error) {

        console.error(
            "Accept emergency error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while accepting emergency"
        });
    }
};


// ============================================================
// UPDATE EMERGENCY STATUS
// ============================================================

const updateEmergencyStatus = async (
    req,
    res
) => {

    try {

        const {
            status
        } = req.body;

        const allowedStatuses = [
            "in_progress",
            "resolved"
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
            await Emergency.findOne({
                _id:
                    req.params.emergencyId,
                assignedHelper:
                    req.user.id
            });

        if (!emergency) {

            return res.status(404).json({
                success: false,
                message:
                    "Assigned emergency not found"
            });
        }

        if (
            emergency.status ===
            "cancelled"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Cancelled emergencies cannot be updated"
            });
        }

        if (
            emergency.status ===
            "resolved"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Emergency is already resolved"
            });
        }

        emergency.status =
            status;

        await emergency.save();

        if (
            status ===
            "in_progress"
        ) {

            await HelpRequest.updateMany(
                {
                    emergency:
                        emergency._id,

                    helper:
                        req.user.id,

                    status: "accepted"
                },
                {
                    status:
                        "accepted"
                }
            );

            await createNotification({
                recipient:
                    emergency.user,
                type:
                    "system",
                title:
                    "Responder Is On The Way",
                message:
                    "Your assigned responder has started responding to your emergency.",
                emergency:
                    emergency._id
            });

        }


        if (
            status ===
            "resolved"
        ) {

            await HelpRequest.updateMany(
                {
                    emergency:
                        emergency._id,

                    helper:
                        req.user.id,

                    status: {
                        $in: [
                            "accepted",
                            "matched"
                        ]
                    }
                },
                {
                    status:
                        "completed"
                }
            );

            const helper =
                await Helper.findOne({
                    user:
                        req.user.id
                });

            if (helper) {

                helper.isAvailable =
                    true;

                helper.completedRequests =
                    Number(
                        helper.completedRequests ||
                        0
                    ) + 1;

                await helper.save();
            }

            await createNotification({
                recipient:
                    emergency.user,
                type:
                    "completed",
                title:
                    "Emergency Resolved",
                message:
                    "Your emergency response has been marked as resolved.",
                emergency:
                    emergency._id
            });

            await createNotification({
                recipient:
                    req.user.id,
                type:
                    "completed",
                title:
                    "Response Completed",
                message:
                    "The emergency has been marked as resolved. Thank you for helping.",
                emergency:
                    emergency._id
            });
        }

        res.json({
            success: true,
            message:
                `Emergency status updated to ${status}`,
            emergency
        });

    } catch (error) {

        console.error(
            "Update emergency status error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while updating emergency status"
        });
    }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    registerResponder,
    createHelperProfile,
    getMyHelperProfile,
    updateAvailability,
    updateLocation,
    getResponderLocation,
    getResponderRequests,
    acceptEmergency,
    updateEmergencyStatus
};