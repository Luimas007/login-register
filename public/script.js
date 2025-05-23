document.addEventListener("DOMContentLoaded", () => {
  // Common elements and functions
  const showMessage = (message, type) => {
    const messageDiv = document.getElementById("message");
    if (messageDiv) {
      messageDiv.textContent = message;
      messageDiv.className = `alert alert-${type}`;
      messageDiv.style.display = "block";

      setTimeout(() => {
        messageDiv.style.display = "none";
      }, 5000);
    }
  };

  // Check authentication for protected pages
  const checkAuth = () => {
    const token = localStorage.getItem("token");
    if (
      !token &&
      (window.location.pathname.includes("profile") ||
        window.location.pathname.includes("post-lost") ||
        window.location.pathname.includes("post-found"))
    ) {
      window.location.href = "/login.html";
      return false;
    }
    return token;
  };

  // Set up logout functionality
  const logoutElements = document.querySelectorAll("#logout");
  if (logoutElements.length > 0) {
    logoutElements.forEach((element) => {
      element.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("token");
        window.location.href = "/login.html";
      });
    });
  }

  // Registration form
  const registerForm = document.getElementById("register-form");
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
          setTimeout(() => (window.location.href = "/otp.html"), 1500);
        }
      } catch (error) {
        showMessage("An error occurred. Please try again.", "danger");
        console.error("Registration error:", error);
      }
    });
  }

  // OTP Verification
  const otpForm = document.getElementById("otp-form");
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
          setTimeout(() => (window.location.href = "/login.html"), 2000);
        }
      } catch (error) {
        showMessage("An error occurred. Please try again.", "danger");
        console.error("OTP verification error:", error);
      }
    });
  }

  // Login form
  const loginForm = document.getElementById("login-form");
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
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          setTimeout(() => {
            window.location.href = "/profile.html";
          }, 1500);
        }
      } catch (error) {
        showMessage("An error occurred. Please try again.", "danger");
        console.error("Login error:", error);
      }
    });
  }

  // Forgot Password
  const forgotPasswordForm = document.getElementById("forgot-password-form");
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
          setTimeout(() => (window.location.href = "/login.html"), 3000);
        }
      } catch (error) {
        showMessage("An error occurred. Please try again.", "danger");
        console.error("Forgot password error:", error);
      }
    });
  }

  // Reset Password
  const resetPasswordForm = document.getElementById("reset-password-form");
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
          setTimeout(() => (window.location.href = "/login.html"), 2000);
        }
      } catch (error) {
        showMessage("An error occurred. Please try again.", "danger");
        console.error("Reset password error:", error);
      }
    });
  }

  // Lost Item Report
  const lostForm = document.getElementById("lost-form");
  if (lostForm) {
    if (!checkAuth()) return;

    lostForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData();
      formData.append("place", document.getElementById("place").value);
      formData.append("time", document.getElementById("time").value);
      formData.append("date", document.getElementById("date").value);
      formData.append("image", document.getElementById("image").files[0]);

      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/report-lost", {
          method: "POST",
          headers: {
            Authorization: token,
          },
          body: formData,
        });

        const data = await res.json();
        showMessage(data.message, res.ok ? "success" : "danger");

        if (res.ok) {
          setTimeout(() => {
            window.location.href = "/profile.html";
          }, 1500);
        }
      } catch (error) {
        showMessage("An error occurred. Please try again.", "danger");
        console.error("Lost item report error:", error);
      }
    });
  }

  // Found Item Report
  const foundForm = document.getElementById("found-form");
  if (foundForm) {
    if (!checkAuth()) return;

    foundForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData();
      formData.append("place", document.getElementById("place").value);
      formData.append("time", document.getElementById("time").value);
      formData.append("date", document.getElementById("date").value);
      formData.append("image", document.getElementById("image").files[0]);

      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/report-found", {
          method: "POST",
          headers: {
            Authorization: token,
          },
          body: formData,
        });

        const data = await res.json();
        showMessage(data.message, res.ok ? "success" : "danger");

        if (res.ok) {
          setTimeout(() => {
            window.location.href = "/profile.html";
          }, 1500);
        }
      } catch (error) {
        showMessage("An error occurred. Please try again.", "danger");
        console.error("Found item report error:", error);
      }
    });
  }

  // Profile Page
  if (window.location.pathname.includes("profile.html")) {
    if (!checkAuth()) return;

    const loadProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user"));

        // Display user info
        if (user) {
          document.getElementById("profile-name").textContent = user.username;
          document.getElementById("profile-email").textContent = user.email;
          document.getElementById("profile-rollno").textContent = user.rollNo;
          document.getElementById("profile-phone").textContent = user.phone;
          document.getElementById("profile-dept").textContent = user.department;
          if (user.idCard) {
            document.getElementById("profile-image").src = user.idCard;
          }
        }

        // Load user's posts
        const res = await fetch("/api/user-posts", {
          headers: {
            Authorization: token,
          },
        });

        if (res.ok) {
          const posts = await res.json();
          const lostItemsTable = document.getElementById("lost-items");
          const foundItemsTable = document.getElementById("found-items");

          // Clear existing rows
          lostItemsTable.innerHTML = "";
          foundItemsTable.innerHTML = "";

          // Populate tables
          posts.forEach((post) => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${new Date(post.date).toLocaleDateString()}</td>
              <td>${post.place}</td>
              <td>${post.time}</td>
              <td>${post.status}</td>
            `;

            if (post.type === "lost") {
              lostItemsTable.appendChild(row);
            } else {
              foundItemsTable.appendChild(row);
            }
          });
        }
      } catch (error) {
        console.error("Profile load error:", error);
        showMessage("Failed to load profile data", "danger");
      }
    };

    loadProfile();
  }
});
