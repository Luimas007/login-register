// Registration
document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("register-form");
  const otpForm = document.getElementById("otp-form");
  const loginForm = document.getElementById("login-form");

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("reg-username").value;
      const email = document.getElementById("reg-email").value;
      const password = document.getElementById("reg-password").value;

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      document.getElementById("message").innerText = data.message;

      if (data.message.includes("OTP sent")) {
        localStorage.setItem("pendingEmail", email);
        window.location.href = "otp.html";
      }
    });
  }

  if (otpForm) {
    otpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const otp = document.getElementById("otp-input").value;
      const email = localStorage.getItem("pendingEmail");

      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      document.getElementById("message").innerText = data.message;

      if (data.message.includes("complete")) {
        localStorage.removeItem("pendingEmail");
        setTimeout(() => (window.location.href = "login.html"), 2000);
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      document.getElementById("message").innerText = data.message;
    });
  }
});
