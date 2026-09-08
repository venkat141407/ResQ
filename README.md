# ResQ
Community Emergency Response


# 🚨 ResQ — Community Emergency Assistance & Response Platform

> **Help can be closer than you think.**

ResQ is a full-stack emergency assistance and community response platform designed to connect people requesting urgent assistance with nearby verified responders.

The platform allows users to report emergencies with their location and required assistance, while responders can receive, accept, and manage emergency requests. Administrators can monitor users, responders, emergencies, and overall platform activity through a dedicated dashboard.

🌐 **Live Demo:** `PASTE_YOUR_RENDER_URL_HERE`

🎥 **Demo Video:** `PASTE_YOUR_YOUTUBE_OR_DRIVE_LINK_HERE`

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Key Features](#-key-features)
- [User Roles](#-user-roles)
- [System Workflow](#-system-workflow)
- [Technology Stack](#-technology-stack)
- [Project Architecture](#-project-architecture)
- [Project Structure](#-project-structure)
- [Database Design](#-database-design)
- [Authentication & Security](#-authentication--security)
- [Location & Mapping](#-location--mapping)
- [Admin Dashboard](#-admin-dashboard)
- [Deployment](#-deployment)
- [Installation & Local Setup](#-installation--local-setup)
- [Testing](#-testing)
- [Screenshots](#-screenshots)
- [Future Improvements](#-future-improvements)
- [Disclaimer](#-disclaimer)
- [Learning Outcomes](#-learning-outcomes)
- [License](#-license)

---

# 🚨 Overview

During an emergency, finding the right assistance quickly can be difficult.

ResQ provides a centralized platform where:

- A user can report an emergency.
- The user's location can be captured using GPS.
- The user can specify the type and priority of the emergency.
- Required assistance can be requested.
- Nearby verified responders can be matched.
- Responders can accept and manage requests.
- Users can track emergency progress.
- Administrators can monitor the entire platform.

The goal is to demonstrate how modern web technologies, databases, authentication, geolocation, mapping, and role-based systems can be combined into a practical emergency-response application.

---

# ❗ Problem Statement

Traditional emergency assistance often depends on calling multiple people or services individually.

This can create problems such as:

- Difficulty finding nearby assistance.
- Lack of centralized emergency information.
- Delays in communicating location.
- Difficulty coordinating volunteers or responders.
- Limited visibility of emergency status.
- No centralized administration and monitoring.

ResQ addresses these challenges by providing a centralized digital coordination platform.

---

# 💡 Proposed Solution

ResQ connects emergency requesters with verified community responders.

### User

A user can:

1. Create an account.
2. Log in securely.
3. Report an emergency.
4. Share their location.
5. Select emergency type.
6. Set emergency priority.
7. Request a specific type of assistance.
8. View emergency status.
9. Track assigned responder information.
10. View emergency history.
11. Manage profile and emergency contacts.
12. Receive notifications.

### Responder

A responder can:

1. Register as a responder.
2. Select supported assistance types.
3. Provide location.
4. Wait for verification.
5. Set availability.
6. View emergency requests.
7. Accept suitable requests.
8. Update emergency progress.
9. Complete emergency assistance.
10. Maintain responder activity statistics.

### Administrator

An administrator can:

1. View registered users.
2. View responders.
3. Verify responders.
4. Monitor emergencies.
5. View emergency status.
6. Monitor platform statistics.
7. Manage platform activity.

---

# ✨ Key Features

## 👤 User Features

- Secure registration and login
- JWT-based authentication
- Emergency reporting
- Emergency type selection
- Emergency priority
- GPS-based location
- Emergency description
- Emergency tracking
- Emergency history
- Emergency cancellation
- Emergency contacts
- Profile management
- Notifications
- Responsive interface

---

## 🚑 Emergency Features

Supported emergency types:

- 🏥 Medical
- 🚗 Accident
- 🔥 Fire
- 🚔 Crime
- 🩸 Blood
- ⚠️ Other

Emergency priorities:

- Low
- Medium
- High
- Critical

Emergency lifecycle:

```text
Pending
   ↓
Matched
   ↓
Accepted
   ↓
In Progress
   ↓
Resolved

An emergency can also be cancelled when appropriate.

🦺 Responder Features

Responders can register with specific capabilities:

First Aid
Transport
Blood
Medicine
Shelter
Other

The platform maintains responder information including:

Availability
Verification status
Location
Rating
Completed requests
Last location update

Only verified responders are eligible for active emergency assistance.

👨‍💼 Admin Features

The administrative dashboard provides centralized platform monitoring.

Admin Sections
Dashboard
Users
Responders
Emergencies
Analytics

The dashboard provides visibility into the platform's operational data.

🔄 System Workflow
                    ┌─────────────────┐
                    │      USER       │
                    └────────┬────────┘
                             │
                             ▼
                    Report Emergency
                             │
                             ▼
                     Capture Location
                             │
                             ▼
                    Select Help Type
                             │
                             ▼
                  ┌─────────────────────┐
                  │  ResQ Backend API   │
                  └──────────┬──────────┘
                             │
                             ▼
                    Find Nearby Verified
                         Responders
                             │
                             ▼
                    Responder Receives
                         Request
                             │
                             ▼
                       Accept Request
                             │
                             ▼
                      Emergency Active
                             │
                             ▼
                     Assistance Provided
                             │
                             ▼
                         RESOLVED
🏗️ Technology Stack
Frontend
HTML5
CSS3
JavaScript
Responsive Web Design
Leaflet.js
OpenStreetMap
Backend
Node.js
Express.js
REST API
JWT Authentication
bcryptjs
CORS
Database
MongoDB
MongoDB Atlas
Mongoose ODM
Deployment
GitHub
Render
🧠 Project Architecture

ResQ follows a full-stack client-server architecture.

┌─────────────────────────────────────┐
│             Frontend                │
│                                     │
│ User │ Responder │ Admin Interfaces │
└──────────────────┬──────────────────┘
                   │
                   │ HTTP / REST API
                   ▼
┌─────────────────────────────────────┐
│             Express.js              │
│                                     │
│ Routes → Middleware → Controllers   │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│              Mongoose               │
│                                     │
│ Models / Database Operations         │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│           MongoDB Atlas             │
└─────────────────────────────────────┘
📁 Project Structure
ResQ/
│
├── backend/
│   ├── config/
│   │   └── database.js
│   │
│   ├── controllers/
│   │   ├── admincontroller.js
│   │   ├── authcontroller.js
│   │   ├── emergencycontroller.js
│   │   ├── helpercontroller.js
│   │   ├── notificationcontroller.js
│   │   └── profilecontroller.js
│   │
│   ├── middleware/
│   │   ├── adminmiddleware.js
│   │   ├── authmiddleware.js
│   │   └── helpermiddleware.js
│   │
│   ├── models/
│   │   ├── emergency.js
│   │   ├── helper.js
│   │   ├── helprequest.js
│   │   ├── notification.js
│   │   └── user.js
│   │
│   ├── routes/
│   │   ├── adminroutes.js
│   │   ├── authroutes.js
│   │   ├── emergencyroutes.js
│   │   ├── helperroutes.js
│   │   ├── notificationroutes.js
│   │   └── profileroutes.js
│   │
│   ├── utils/
│   │   ├── matching.js
│   │   └── notifications.js
│   │
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── assets/
│   ├── dashboard.html
│   ├── emergency.html
│   ├── help.html
│   ├── history.html
│   ├── index.html
│   ├── login-options.html
│   ├── login.html
│   ├── notifications.html
│   ├── profile.html
│   ├── register.html
│   ├── splash.html
│   └── tracking.html
│
├── responder/
│   ├── css/
│   ├── js/
│   ├── dashboard.html
│   ├── emergency.html
│   ├── login.html
│   ├── notifications.html
│   └── register.html
│
├── admin/
│   ├── css/
│   ├── js/
│   ├── analytics.html
│   ├── dashboard.html
│   ├── emergencies.html
│   ├── login.html
│   ├── responders.html
│   └── users.html
│
├── css/
│   ├── auth.css
│   ├── dashboard.css
│   ├── responsive.css
│   └── style.css
│
├── js/
│   ├── api.js
│   ├── app.js
│   ├── auth.js
│   ├── dashboard.js
│   ├── emergency.js
│   ├── help.js
│   ├── history.js
│   ├── notifications.js
│   ├── profile.js
│   └── tracking.js
│
└── README.md
🗄️ Database Design

ResQ uses MongoDB with Mongoose.

User

Stores:

Name
Email
Phone
Password hash
Role
Emergency contacts

Roles:

user
helper
admin
Emergency

Stores:

Requesting user
Emergency type
Description
Latitude
Longitude
Address
Priority
Status
Assigned responder
Timestamps
Helper

Stores:

Responder user
Help types
Location
Availability
Verification status
Rating
Completed requests
Last location update
HelpRequest

Stores:

Emergency
Requester
Responder
Help type
Status
Distance
Timestamps
Notification

Stores:

Recipient
Notification type
Title
Message
Related emergency
Read/unread status
Timestamp
🔐 Authentication & Security

ResQ implements role-based authentication.

Authentication
JWT tokens
Protected API routes
Password hashing with bcrypt
Token-based sessions
Authorization

Different roles have different permissions:

USER
 └── User features

HELPER
 └── Responder features

ADMIN
 └── Administrative features

Protected routes verify the user's authentication token before processing requests.

Passwords are never stored as plain text.

📍 Location & Mapping

ResQ uses browser geolocation to obtain the user's current coordinates.

The platform uses:

Latitude
Longitude
Browser Geolocation API
Leaflet.js
OpenStreetMap

Location information is used to:

Identify emergency location.
Find nearby responders.
Display emergency locations.
Display responder locations when available.

Distance calculations use geographic coordinates to determine proximity.

🧭 Responder Matching

The matching system searches for responders based on:

Availability
Verification status
Supported help type
Geographic distance

Responders are ranked using proximity and responder information.

The system currently uses a configurable nearby-response radius.

👨‍💼 Admin Dashboard

The admin interface provides dedicated pages for:

Admin Dashboard
│
├── Users
├── Responders
├── Emergencies
└── Analytics

Administrators can monitor the operational state of the platform from one centralized interface.

🌐 Deployment

ResQ is deployed as a Node.js Web Service using Render.

Production Architecture
GitHub
   │
   ▼
Render
   │
   ├── Node.js
   ├── Express.js
   └── ResQ Application
          │
          ▼
     MongoDB Atlas

The production application uses environment variables for sensitive configuration.

Environment Variables
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

.env files containing credentials must never be committed to GitHub.

💻 Installation & Local Setup
1. Clone the repository
git clone https://github.com/venkat141407/ResQ.git
cd ResQ
2. Install backend dependencies
cd backend
npm install
3. Create .env

Inside the backend directory:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
4. Start the server
npm start

For development:

npm run dev
5. Open the application
http://localhost:5000/
🧪 Testing

The application was tested across its major functional modules.

User
Registration
Login
Dashboard
Emergency creation
GPS location
Emergency tracking
Emergency history
Notifications
Profile
Emergency contacts
Responder
Registration
Login
Profile
Availability
Location
Emergency requests
Emergency acceptance
Emergency status updates
Admin
Admin authentication
Dashboard
User management
Responder management
Emergency monitoring
Analytics
Backend
API routing
JWT authentication
Role authorization
MongoDB operations
Emergency validation
Responder matching
Notification operations
📸 Screenshots

Add screenshots here after taking final production screenshots.

Example:

![ResQ Home](screenshots/home.png)

![User Dashboard](screenshots/dashboard.png)

![Emergency Tracking](screenshots/tracking.png)

![Responder Dashboard](screenshots/responder-dashboard.png)

![Admin Dashboard](screenshots/admin-dashboard.png)
🎥 Demo Video

A complete project demonstration is available here:

Demo Video:
PASTE_YOUR_VIDEO_LINK_HERE

The demonstration covers:

Landing Page
     ↓
User Registration
     ↓
User Login
     ↓
Emergency Creation
     ↓
Location Capture
     ↓
Responder Workflow
     ↓
Emergency Tracking
     ↓
Admin Dashboard
🔮 Future Improvements

Potential future improvements include:

Real-time communication using WebSockets
Socket.IO based emergency events
Push notifications
SMS notifications
Emergency service integration
Advanced responder routing
Google Maps integration
Navigation for responders
Automatic emergency escalation
AI-assisted emergency classification
Advanced analytics
Mobile application
Verified medical volunteers
Hospital and blood-bank integration
Multi-language support
Improved fraud and abuse detection
⚠️ Disclaimer

ResQ is an educational and demonstration project.

It is not a replacement for official emergency services, hospitals, police, fire departments, ambulance services, or other professional emergency-response organizations.

In a real emergency, users should contact the appropriate official emergency service immediately.

The platform should not be relied upon as the sole source of emergency assistance.

🎓 Project Purpose

This project was developed as a practical full-stack software engineering project to demonstrate the integration of:

Frontend development
Backend development
REST APIs
Database design
Authentication
Authorization
Geolocation
Mapping
Role-based systems
Cloud deployment
Responsive UI
Real-world problem solving
📚 Learning Outcomes

Through this project, the following concepts were implemented:

Frontend Development
HTML
CSS
JavaScript
Responsive interfaces
API integration
Browser geolocation
Map integration
Backend Development
Node.js
Express.js
REST API architecture
Middleware
Controllers
Route management
Authentication
Authorization
Database
MongoDB
MongoDB Atlas
Mongoose
Schema design
Relationships
CRUD operations
Security
JWT authentication
Password hashing
Protected routes
Role-based access control
Environment variables
Deployment
GitHub
Render
MongoDB Atlas
Production environment configuration
👨‍💻 Project Information

Project: ResQ — Community Emergency Assistance & Response Platform

Type: Full-Stack Web Application

Architecture: Client–Server

Backend: Node.js + Express.js

Database: MongoDB Atlas

Frontend: HTML + CSS + JavaScript

Mapping: Leaflet + OpenStreetMap

Deployment: Render
