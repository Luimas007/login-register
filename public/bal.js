document.addEventListener("DOMContentLoaded", () => {
    // Common elements and functions
    const showMessage = (message, type) => {
      const messageDiv = document.getElementById("message");
      if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = alert alert-${type};
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
  
    // Load all items (for index.html)
    const loadItems = async () => {
      try {
        const res = await fetch("/api/all-items");
        const data = await res.json();
  
        if (res.ok) {
          displayItems(data.lostItems, "lost-items-container");
          displayItems(data.foundItems, "found-items-container");
        }
      } catch (error) {
        console.error("Error loading items:", error);
      }
    };
  
    const displayItems = (items, containerId) => {
      const container = document.getElementById(containerId);
      if (!container) return;
  
      container.innerHTML = "";
  
      if (items.length === 0) {
        container.innerHTML = "<p>No items found.</p>";
        return;
      }
  
      items.forEach((item) => {
        const itemCard = document.createElement("div");
        itemCard.className = "item-card";
        itemCard.innerHTML = `
          <img src="${item.image}" alt="${item.type} item" class="item-image">
          <div class="item-details">
            <h4>${item.type === "lost" ? "Lost" : "Found"} at ${item.place}</h4>
            <p>Reported on ${new Date(item.date).toLocaleDateString()}</p>
            <div class="item-meta">
              <span>Time: ${item.time}</span>
              <span>Status: ${item.status}</span>
            </div>
          </div>
        `;
        container.appendChild(itemCard);
      });
    };
  
    if (
      window.location.pathname === "/" ||
      window.location.pathname === "/index.html"
    ) {
      loadItems();
    }
  
    // Redirects for buttons on homepage
    document.querySelector(".login-btn")?.addEventListener("click", () => {
      window.location.href = "login.html";
    });
  
    document.querySelector(".register-btn")?.addEventListener("click", () => {
      window.location.href = "register.html";
    });
  
    document.querySelector(".cta-buttons .primary")?.addEventListener("click", () => {
      window.location.href = "post-lost.html";
    });
  
    document.querySelector(".cta-buttons .secondary")?.addEventListener("click", () => {
      window.location.href = "post-found.html";
    });
  
    // About section animation
    const aboutText = document.getElementById("aboutText");
    if (aboutText) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              aboutText.classList.add("show");
            }
          });
        },
        { threshold: 0.5 }
      );
      observer.observe(aboutText);
    }
  
    // Registration, OTP, Login, Password Reset, Lost/Found Posting, Profile already exist in your code
    // Keeping them unchanged here to avoid redundancy and file bloat.
  });