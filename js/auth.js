const API_URL = "/api";

// =========================
// REGISTER
// =========================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const password = document.getElementById("password").value;

        const message = document.getElementById("registerMessage");

        message.textContent = "Creating your account...";

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    password
                })
            });

            const data = await response.json();

            if (data.success) {
                message.textContent = "Account created successfully! Redirecting...";

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1200);

            } else {
                message.textContent = data.message || "Registration failed.";
            }

        } catch (error) {
            console.error("Registration error:", error);

            message.textContent =
                "Unable to connect to ResQ server.";
        }
    });
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const message = document.getElementById("loginMessage");

        message.textContent = "Logging in...";

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem("resqToken", data.token);
                localStorage.setItem("resqUser", JSON.stringify(data.user));

                message.textContent = "Login successful! Redirecting...";

                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 1000);
            } else {
                message.textContent = data.message || "Login failed.";
            }

        } catch (error) {
            console.error("Login error:", error);
            message.textContent = "Unable to connect to ResQ server.";
        }
    });
}