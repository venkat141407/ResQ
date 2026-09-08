const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

const connectDB =
    require("./config/database");

const app =
    express();


/* =========================================================
   DATABASE
   ========================================================= */

connectDB();


/* =========================================================
   MIDDLEWARE
   ========================================================= */

app.use(
    cors()
);

app.use(
    express.json({
        limit: "1mb"
    })
);


/* =========================================================
   API ROUTES
   ========================================================= */

const authRoutes =
    require("./routes/authroutes");

const emergencyRoutes =
    require("./routes/emergencyroutes");

const helperRoutes =
    require("./routes/helperroutes");

const adminRoutes =
    require("./routes/adminroutes");

const notificationRoutes =
    require("./routes/notificationroutes");

const profileRoutes =
    require("./routes/profileroutes");


app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/emergencies",
    emergencyRoutes
);

app.use(
    "/api/helpers",
    helperRoutes
);

app.use(
    "/api/admin",
    adminRoutes
);

app.use(
    "/api/notifications",
    notificationRoutes
);

app.use(
    "/api/profile",
    profileRoutes
);


/* =========================================================
   SERVE RESQ FRONTEND
   ========================================================= */

/*
 * Project structure:
 *
 * RESQ/
 * ├── backend/
 * │   └── server.js
 * ├── frontend/
 * ├── responder/
 * ├── admin/
 * ├── css/
 * └── js/
 */

const projectRoot = path.join(__dirname, "..");


app.use(
    express.static(projectRoot)
);


/* =========================================================
   RESQ INTRO / SPLASH SCREEN
   ========================================================= */

/*
 * When the user opens:
 *

 *
 * show the ResQ splash screen first.
 */

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                projectRoot,
                "frontend",
                "splash.html"
            )
        );

    }
);


/* =========================================================
   404 HANDLER
   ========================================================= */

app.use(
    (req, res) => {

        res.status(404).json({
            success: false,
            message:
                "API endpoint or page not found"
        });

    }
);


/* =========================================================
   ERROR HANDLER
   ========================================================= */

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "Unhandled server error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Internal server error"
        });

    }
);


/* =========================================================
   SERVER
   ========================================================= */

const PORT =
    process.env.PORT ||
    5000;


const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {

    console.log(
        `🚨 ResQ server running on port ${PORT}`
    );

    console.log(
        `🌐 ResQ application started successfully`
    );

});
