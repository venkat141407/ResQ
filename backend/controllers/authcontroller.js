const bcrypt = require("bcryptjs");
const User = require("../models/user");
const jwt = require("jsonwebtoken");


// ============================================================
// REGISTER USER
// ============================================================

const registerUser = async (
    req,
    res
) => {

    try {

        const {
            name,
            email,
            phone,
            password
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

        if (
            name.trim().length <
            2
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Name must contain at least 2 characters"
            });
        }

        if (
            password.length <
            6
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must contain at least 6 characters"
            });
        }

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            !emailRegex.test(
                email
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid email address"
            });
        }

        const existingUser =
            await User.findOne({
                email:
                    email.toLowerCase()
            });

        if (existingUser) {

            return res.status(400).json({
                success: false,
                message:
                    "User with this email already exists"
            });
        }

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        const user =
            await User.create({

                name:
                    name.trim(),

                email:
                    email.toLowerCase().trim(),

                phone:
                    phone.trim(),

                password:
                    hashedPassword,

                role:
                    "user",

                emergencyContacts:
                    []
            });

        res.status(201).json({

            success: true,

            message:
                "Registration successful",

            user: {

                id:
                    user._id,

                name:
                    user.name,

                email:
                    user.email,

                phone:
                    user.phone,

                role:
                    user.role,

                emergencyContacts:
                    user.emergencyContacts
            }
        });

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error during registration"
        });
    }
};


// ============================================================
// LOGIN USER
// ============================================================

const loginUser = async (
    req,
    res
) => {

    try {

        const {
            email,
            password
        } = req.body;

        if (
            !email ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please enter email and password"
            });
        }

        const user =
            await User.findOne({
                email:
                    email.toLowerCase().trim()
            });

        if (!user) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password"
            });
        }

        const isMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!isMatch) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password"
            });
        }

        const token =
            jwt.sign(
                {
                    id:
                        user._id,

                    role:
                        user.role
                },

                process.env.JWT_SECRET,

                {
                    expiresIn:
                        "7d"
                }
            );

        res.json({

            success: true,

            message:
                "Login successful",

            token,

            user: {

                id:
                    user._id,

                name:
                    user.name,

                email:
                    user.email,

                phone:
                    user.phone,

                role:
                    user.role,

                emergencyContacts:
                    user.emergencyContacts ||
                    []
            }
        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error during login"
        });
    }
};


module.exports = {
    registerUser,
    loginUser
};