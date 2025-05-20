document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("register-form");
  const otpForm = document.getElementById("otp-form");
  const loginForm = document.getElementById("login-form");
  const forgotPasswordForm = document.getElementById("forgot-password-form");
  const resetPasswordForm = document.getElementById("reset-password-form");

  // Registration
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(registerForm);

      try {
        const res = await fetch("/api/register", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        showMessage(data.message, res.ok ? "success" : "danger");

        if (res.ok && data.message.includes("OTP sent")) {
          localStorage.setItem(
            "pendingEmail",
            document.getElementById("email").value
          );
          setTimeout(() => (window.location.href = "otp.html"), 1500);
        }
      } catch (error) {
        showMessage("An error occurred. Please try again.", "danger");
        console.error("Registration error:", error);
      }
    });
  }

  // OTP Verification
  if (otpForm) {
    otpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const otp = document.getElementById("otp").value;
      const email = localStorage.getItem("pendingEmail");

      try {
        const res = await fetch("/api/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        });

        const data = await res.json();
        showMessage(data.message, res.ok ? "success" : "danger");

        if (res.ok && data.message.includes("complete")) {
          localStorage.removeItem("pendingEmail");
          setTimeout(() => (window.location.href = "login.html"), 2000);
        }
      } catch (error) {
        showMessage("An error occurred. Please try again.", "danger");
        console.error("OTP verification error:", error);
      }
    });
  }

  // Login
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        showMessage(data.message, res.ok ? "success" : "danger");

        if (res.ok) {
          setTimeout(() => {
            // Redirect to dashboard or home page after successful login
            window.location.href = "dashboard.html";
          }, 1500);
        }
      } catch (error) {
        showMessage("An error occurred. Please try again.", "danger");
        console.error("Login error:", error);
      }
    });
  }

  // Forgot Password
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;

      try {
        const res = await fetch("/api/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        showMessage(data.message, res.ok ? "success" : "danger");

        if (res.ok) {
          setTimeout(() => (window.location.href = "login.html"), 3000);
        }
      } catch (error) {
        showMessage("An error occurred. Please try again.", "danger");
        console.error("Forgot password error:", error);
      }
    });
  }

  // Reset Password
  if (resetPasswordForm) {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      document.getElementById("token").value = token;
    }

    resetPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const token = document.getElementById("token").value;
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (newPassword !== confirmPassword) {
        showMessage("Passwords do not match.", "danger");
        return;
      }

      try {
        const res = await fetch("/api/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword }),
        });

        const data = await res.json();
        showMessage(data.message, res.ok ? "success" : "danger");

        if (res.ok) {
          setTimeout(() => (window.location.href = "login.html"), 2000);
        }
      } catch (error) {
        showMessage("An error occurred. Please try again.", "danger");
        console.error("Reset password error:", error);
      }
    });
  }

  // Helper function to show messages
  function showMessage(message, type) {
    const messageDiv = document.getElementById("message");
    messageDiv.textContent = message;
    messageDiv.className = `alert alert-${type}`;
    messageDiv.style.display = "block";

    setTimeout(() => {
      messageDiv.style.display = "none";
    }, 5000);
  }
});
