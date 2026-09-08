const Helper = require("../models/helper");


// ============================================================
// CALCULATE DISTANCE
// Haversine formula
// Returns distance in kilometres
// ============================================================

const calculateDistance = (
    lat1,
    lon1,
    lat2,
    lon2
) => {

    const latitude1 =
        Number(lat1);

    const longitude1 =
        Number(lon1);

    const latitude2 =
        Number(lat2);

    const longitude2 =
        Number(lon2);

    if (
        !Number.isFinite(latitude1) ||
        !Number.isFinite(longitude1) ||
        !Number.isFinite(latitude2) ||
        !Number.isFinite(longitude2)
    ) {
        return Infinity;
    }

    const R = 6371;

    const dLat =
        (
            (latitude2 - latitude1) *
            Math.PI
        ) / 180;

    const dLon =
        (
            (longitude2 - longitude1) *
            Math.PI
        ) / 180;

    const lat1Rad =
        (latitude1 * Math.PI) / 180;

    const lat2Rad =
        (latitude2 * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +

        Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const safeA =
        Math.min(
            1,
            Math.max(
                0,
                a
            )
        );

    const c =
        2 *
        Math.atan2(
            Math.sqrt(safeA),
            Math.sqrt(
                1 - safeA
            )
        );

    return R * c;
};


// ============================================================
// FIND NEARBY VERIFIED HELPERS
// ============================================================

const findNearbyHelpers = async (
    latitude,
    longitude,
    helpType
) => {

    const requesterLatitude =
        Number(latitude);

    const requesterLongitude =
        Number(longitude);

    if (
        !Number.isFinite(
            requesterLatitude
        ) ||
        !Number.isFinite(
            requesterLongitude
        )
    ) {
        return [];
    }

    if (!helpType) {
        return [];
    }

    // Maximum matching radius.
    const MAX_DISTANCE_KM = 20;

    // Only verified + available responders
    // capable of the requested assistance
    // are considered.
    const helpers =
        await Helper.find({
            isAvailable: true,

            verificationStatus:
                "verified",

            helpTypes:
                helpType
        })
        .populate(
            "user",
            "name email phone role"
        );

    const nearbyHelpers =
        helpers
            .filter(
                helper => {

                    if (
                        !helper.user
                    ) {
                        return false;
                    }

                    if (
                        helper.user.role !==
                        "helper"
                    ) {
                        return false;
                    }

                    if (
                        !helper.location
                    ) {
                        return false;
                    }

                    const helperLatitude =
                        Number(
                            helper.location.latitude
                        );

                    const helperLongitude =
                        Number(
                            helper.location.longitude
                        );

                    return (
                        Number.isFinite(
                            helperLatitude
                        ) &&
                        Number.isFinite(
                            helperLongitude
                        )
                    );
                }
            )
            .map(
                helper => {

                    const distance =
                        calculateDistance(
                            requesterLatitude,
                            requesterLongitude,
                            helper.location.latitude,
                            helper.location.longitude
                        );

                    return {
                        helper,

                        distance:
                            Number(
                                distance.toFixed(
                                    2
                                )
                            )
                    };
                }
            )
            .filter(
                item =>
                    item.distance <=
                    MAX_DISTANCE_KM
            )
            .sort(
                (
                    a,
                    b
                ) => {

                    // First priority:
                    // closest responder.
                    if (
                        a.distance !==
                        b.distance
                    ) {
                        return (
                            a.distance -
                            b.distance
                        );
                    }

                    // Second priority:
                    // better-rated responder.
                    const ratingA =
                        Number(
                            a.helper.rating ||
                            0
                        );

                    const ratingB =
                        Number(
                            b.helper.rating ||
                            0
                        );

                    if (
                        ratingA !==
                        ratingB
                    ) {
                        return (
                            ratingB -
                            ratingA
                        );
                    }

                    // Third priority:
                    // responders with more
                    // completed requests.
                    const completedA =
                        Number(
                            a.helper.completedRequests ||
                            0
                        );

                    const completedB =
                        Number(
                            b.helper.completedRequests ||
                            0
                        );

                    return (
                        completedB -
                        completedA
                    );
                }
            );

    return nearbyHelpers;
};


// ============================================================
// FIND BEST HELPER
// ============================================================

const findBestHelper = async (
    latitude,
    longitude,
    helpType
) => {

    const helpers =
        await findNearbyHelpers(
            latitude,
            longitude,
            helpType
        );

    if (!helpers.length) {
        return null;
    }

    return helpers[0];
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    calculateDistance,
    findNearbyHelpers,
    findBestHelper
};