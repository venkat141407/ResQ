const authMiddleware = require("./authmiddleware");

const helperMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    if (req.user.role !== "helper") {
        return res.status(403).json({
            success: false,
            message: "Responder access required"
        });
    }

    next();
};

module.exports = helperMiddleware;