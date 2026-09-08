const Emergency = require("../models/emergency");
const HelpRequest = require("../models/helprequest");
const Helper = require("../models/helper");

const {
    findNearbyHelpers
} = require("../utils/matching");

const {
    createNotification
} = require("../utils/notifications");


// ============================================================
// VALIDATION HELPERS
// ============================================================

const VALID_TYPES = [
    "medical",
    "accident",
    "fire",
    "crime",
    "blood",
    "other"
];

const VALID_PRIORITIES = [
    "low",
    "medium",
    "high",
    "critical"
];

const VALID_HELP_TYPES = [
    "first_aid",
    "transport",
    "blood",
    "medicine",
    "shelter",
    "other"
];

const ACTIVE_EMERGENCY_STATUSES = [
    "pending",
    "matched",
    "accepted",
    "in_progress"
];

const isValidCoordinate = (
    latitude,
    longitude
) => {

    const lat =
        Number(latitude);

    const lon =
        Number(longitude);

    return (
        Number.isFinite(lat) &&
        Number.isFinite(lon) &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180
    );
};


// ============================================================
// CREATE EMERGENCY
// ============================================================

const createEmergency = async (
    req,
    res
) => {

    try {

        const {
            type,
            description,
            latitude,
            longitude,
            address,
            priority
        } = req.body;

        if (
            !type ||
            !description ||
            latitude === undefined ||
            longitude === undefined
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please provide emergency type, description and location"
            });
        }

        if (
            !VALID_TYPES.includes(
                type
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid emergency type"
            });
        }

        if (
            typeof description !==
            "string" ||
            description.trim().length <
            5
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Emergency description must contain at least 5 characters"
            });
        }

        if (
            description.trim().length >
            1000
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Emergency description cannot exceed 1000 characters"
            });
        }

        if (
            !isValidCoordinate(
                latitude,
                longitude
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid emergency location"
            });
        }

        const selectedPriority =
            priority || "high";

        if (
            !VALID_PRIORITIES.includes(
                selectedPriority
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid emergency priority"
            });
        }

        // Prevent accidental duplicate submissions
        // within a short period.
        const recentEmergency =
            await Emergency.findOne({
                user: req.user.id,
                status: {
                    $in:
                        ACTIVE_EMERGENCY_STATUSES
                },
                createdAt: {
                    $gte:
                        new Date(
                            Date.now() -
                            2 * 60 * 1000
                        )
                }
            });

        if (recentEmergency) {

            return res.status(409).json({
                success: false,
                message:
                    "You already have an active emergency request. Please track it instead of creating another one.",
                emergencyId:
                    recentEmergency._id
            });
        }

        const emergency =
            await Emergency.create({
                user: req.user.id,

                type,

                description:
                    description.trim(),

                location: {
                    latitude:
                        Number(latitude),

                    longitude:
                        Number(longitude),

                    address:
                        typeof address ===
                        "string"
                            ? address.trim()
                            : ""
                },

                priority:
                    selectedPriority
            });

        await createNotification({
            recipient:
                req.user.id,

            type:
                "emergency",

            title:
                "Emergency Reported",

            message:
                "Your emergency has been successfully reported to the ResQ network.",

            emergency:
                emergency._id
        });

        res.status(201).json({
            success: true,

            message:
                "Emergency reported successfully",

            emergency
        });

    } catch (error) {

        console.error(
            "Create emergency error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while creating emergency"
        });
    }
};


// ============================================================
// FIND HELPERS
// ============================================================

const findHelpersForEmergency = async (
    req,
    res
) => {

    try {

        const {
            latitude,
            longitude,
            helpType
        } = req.body;

        if (
            !isValidCoordinate(
                latitude,
                longitude
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Valid latitude and longitude are required"
            });
        }

        if (
            !VALID_HELP_TYPES.includes(
                helpType
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid help type"
            });
        }

        const helpers =
            await findNearbyHelpers(
                Number(latitude),
                Number(longitude),
                helpType
            );

        const results =
            helpers.map(
                item => ({
                    id:
                        item.helper.user._id,

                    name:
                        item.helper.user.name,

                    phone:
                        item.helper.user.phone,

                    email:
                        item.helper.user.email,

                    helpTypes:
                        item.helper.helpTypes,

                    distance:
                        item.distance,

                    rating:
                        item.helper.rating,

                    completedRequests:
                        item.helper.completedRequests,

                    location: {
                        latitude:
                            item.helper.location.latitude,

                        longitude:
                            item.helper.location.longitude
                    }
                })
            );

        res.json({
            success: true,
            count:
                results.length,
            helpers:
                results
        });

    } catch (error) {

        console.error(
            "Find helpers error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while finding nearby helpers"
        });
    }
};


// ============================================================
// CREATE HELP REQUEST
// ============================================================

const createHelpRequest = async (
    req,
    res
) => {

    try {

        const {
            emergencyId,
            helpType
        } = req.body;

        if (
            !emergencyId ||
            !helpType
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Emergency ID and help type are required"
            });
        }

        if (
            !VALID_HELP_TYPES.includes(
                helpType
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid help type"
            });
        }

        const emergency =
            await Emergency.findOne({
                _id:
                    emergencyId,

                user:
                    req.user.id
            });

        if (!emergency) {

            return res.status(404).json({
                success: false,
                message:
                    "Emergency not found"
            });
        }

        if (
            !ACTIVE_EMERGENCY_STATUSES.includes(
                emergency.status
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "This emergency is no longer accepting help requests"
            });
        }

        // Prevent duplicate active requests.
        const existingRequest =
            await HelpRequest.findOne({
                emergency:
                    emergency._id,

                requester:
                    req.user.id,

                status: {
                    $in: [
                        "requested",
                        "matched",
                        "accepted"
                    ]
                }
            });

        if (existingRequest) {

            return res.status(409).json({
                success: false,
                message:
                    "This emergency already has an active help request"
            });
        }

        const nearbyHelpers =
            await findNearbyHelpers(
                emergency.location.latitude,
                emergency.location.longitude,
                helpType
            );

        let assignedHelper =
            null;

        let distance =
            null;

        if (
            nearbyHelpers.length >
            0
        ) {

            assignedHelper =
                nearbyHelpers[0]
                    .helper
                    .user
                    ._id;

            distance =
                nearbyHelpers[0]
                    .distance;
        }

        const helpRequest =
            await HelpRequest.create({
                emergency:
                    emergency._id,

                requester:
                    req.user.id,

                helper:
                    assignedHelper,

                helpType,

                status:
                    assignedHelper
                        ? "matched"
                        : "requested",

                distance
            });

        if (assignedHelper) {

            emergency.assignedHelper =
                assignedHelper;

            emergency.status =
                "matched";

            await emergency.save();

            await createNotification({
                recipient:
                    assignedHelper,

                type:
                    "match",

                title:
                    "New Emergency Assistance Request",

                message:
                    `A nearby ${helpType.replace(
                        /_/g,
                        " "
                    )} request needs your attention.`,

                emergency:
                    emergency._id
            });

            await createNotification({
                recipient:
                    req.user.id,

                type:
                    "match",

                title:
                    "Responder Found",

                message:
                    "A nearby verified responder has been matched to your emergency.",

                emergency:
                    emergency._id
            });

        } else {

            await createNotification({
                recipient:
                    req.user.id,

                type:
                    "emergency",

                title:
                    "Searching For A Responder",

                message:
                    "No suitable responder is currently available nearby. Your emergency remains active.",

                emergency:
                    emergency._id
            });
        }

        res.status(201).json({
            success: true,

            message:
                assignedHelper
                    ? "Nearby responder matched successfully"
                    : "Help request created. Searching for responders.",

            helpRequest,

            matched:
                Boolean(
                    assignedHelper
                )
        });

    } catch (error) {

        console.error(
            "Create help request error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while creating help request"
        });
    }
};


// ============================================================
// GET MY EMERGENCIES
// ============================================================

const getMyEmergencies = async (
    req,
    res
) => {

    try {

        const emergencies =
            await Emergency.find({
                user:
                    req.user.id
            })
            .populate(
                "assignedHelper",
                "name email phone"
            )
            .sort({
                createdAt:
                    -1
            });

        res.json({
            success: true,

            count:
                emergencies.length,

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


// ============================================================
// GET EMERGENCY BY ID
// ============================================================

const getEmergencyById = async (
    req,
    res
) => {

    try {

        const emergency =
            await Emergency.findOne({
                _id:
                    req.params.emergencyId,

                user:
                    req.user.id
            })
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
                "helper",
                "name email phone"
            )
            .sort({
                createdAt:
                    -1
            });

        res.json({
            success: true,

            emergency,

            helpRequests
        });

    } catch (error) {

        console.error(
            "Get emergency error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while fetching emergency"
        });
    }
};


// ============================================================
// LIVE EMERGENCY TRACKING
// ============================================================

const getEmergencyTracking = async (
    req,
    res
) => {

    try {

        const emergency =
            await Emergency.findOne({
                _id:
                    req.params.emergencyId,

                user:
                    req.user.id
            })
            .populate(
                "user",
                "name email phone"
            );

        if (!emergency) {

            return res.status(404).json({
                success: false,
                message:
                    "Emergency not found or access denied"
            });
        }

        let responder =
            null;

        if (
            emergency.assignedHelper
        ) {

            const helper =
                await Helper.findOne({
                    user:
                        emergency.assignedHelper
                })
                .populate(
                    "user",
                    "name email phone role"
                );

            if (
                helper &&
                helper.user
            ) {

                responder = {

                    id:
                        helper.user._id,

                    name:
                        helper.user.name,

                    email:
                        helper.user.email,

                    phone:
                        helper.user.phone,

                    latitude:
                        helper.location?.latitude ??
                        null,

                    longitude:
                        helper.location?.longitude ??
                        null,

                    isAvailable:
                        helper.isAvailable,

                    verificationStatus:
                        helper.verificationStatus,

                    rating:
                        helper.rating,

                    completedRequests:
                        helper.completedRequests,

                    lastLocationUpdate:
                        helper.lastLocationUpdate
                };
            }
        }

        const latestHelpRequest =
            await HelpRequest.findOne({
                emergency:
                    emergency._id
            })
            .sort({
                updatedAt:
                    -1
            });

        res.json({
            success: true,

            emergency: {

                id:
                    emergency._id,

                type:
                    emergency.type,

                description:
                    emergency.description,

                status:
                    emergency.status,

                priority:
                    emergency.priority,

                location: {

                    latitude:
                        emergency.location.latitude,

                    longitude:
                        emergency.location.longitude,

                    address:
                        emergency.location.address
                },

                createdAt:
                    emergency.createdAt,

                updatedAt:
                    emergency.updatedAt
            },

            requester:
                emergency.user
                    ? {
                        id:
                            emergency.user._id,

                        name:
                            emergency.user.name,

                        email:
                            emergency.user.email,

                        phone:
                            emergency.user.phone
                    }
                    : null,

            responder,

            helpRequest:
                latestHelpRequest
                    ? {

                        id:
                            latestHelpRequest._id,

                        helpType:
                            latestHelpRequest.helpType,

                        status:
                            latestHelpRequest.status,

                        distance:
                            latestHelpRequest.distance,

                        createdAt:
                            latestHelpRequest.createdAt,

                        updatedAt:
                            latestHelpRequest.updatedAt
                    }
                    : null,

            tracking: {

                responderAssigned:
                    Boolean(
                        responder
                    ),

                responderLocationAvailable:
                    Boolean(
                        responder &&
                        responder.latitude !== null &&
                        responder.longitude !== null
                    ),

                lastUpdated:
                    responder
                        ? responder.lastLocationUpdate
                        : null
            }
        });

    } catch (error) {

        console.error(
            "Emergency tracking error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while loading emergency tracking"
        });
    }
};


// ============================================================
// CANCEL EMERGENCY
// ============================================================

const cancelEmergency = async (
    req,
    res
) => {

    try {

        const emergency =
            await Emergency.findOne({
                _id:
                    req.params.emergencyId,

                user:
                    req.user.id
            });

        if (!emergency) {

            return res.status(404).json({
                success: false,
                message:
                    "Emergency not found"
            });
        }

        if (
            emergency.status ===
            "resolved"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "A resolved emergency cannot be cancelled"
            });
        }

        if (
            emergency.status ===
            "cancelled"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Emergency is already cancelled"
            });
        }

        const assignedHelper =
            emergency.assignedHelper;

        emergency.status =
            "cancelled";

        emergency.assignedHelper =
            null;

        await emergency.save();

        await HelpRequest.updateMany(
            {
                emergency:
                    emergency._id,

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

        if (
            assignedHelper
        ) {

            await Helper.findOneAndUpdate(
                {
                    user:
                        assignedHelper
                },
                {
                    isAvailable:
                        true
                }
            );

            await createNotification({
                recipient:
                    assignedHelper,

                type:
                    "system",

                title:
                    "Emergency Cancelled",

                message:
                    "The emergency request assigned to you has been cancelled by the requester.",

                emergency:
                    emergency._id
            });
        }

        await createNotification({
            recipient:
                req.user.id,

            type:
                "system",

            title:
                "Emergency Cancelled",

            message:
                "Your emergency request has been cancelled successfully.",

            emergency:
                emergency._id
        });

        res.json({
            success: true,

            message:
                "Emergency cancelled successfully",

            emergency
        });

    } catch (error) {

        console.error(
            "Cancel emergency error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while cancelling emergency"
        });
    }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    createEmergency,
    findHelpersForEmergency,
    createHelpRequest,
    getMyEmergencies,
    getEmergencyById,
    getEmergencyTracking,
    cancelEmergency
};