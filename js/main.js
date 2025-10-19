/* ==========================================================
   LOCAL TECHNICIAN NETWORK - MAIN SCRIPT
   Handles: Navbar, Auth, Booking, Dashboards, Location, etc.
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM loaded. Initializing...");

  /* ===== GLOBAL ERROR LOGGER ===== */
  window.addEventListener("error", (e) =>
    console.error("💥 JS Error:", e.message)
  );

  /* ===== NAVBAR TOGGLE ===== */
  const menuToggle = document.getElementById("menu-toggle");
  const navbar = document.getElementById("navbar");
  if (menuToggle && navbar) {
    menuToggle.addEventListener("click", () => {
      navbar.classList.toggle("active");
    });
  }

  /* ===== CATEGORY & SERVICE CARD CLICKS ===== */
  document.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("click", () => {
      const category = card.textContent.trim().toLowerCase();
      window.location.href = `technicians.html?category=${encodeURIComponent(category)}`;
    });
  });

  document.querySelectorAll(".service-card").forEach((card) => {
    card.addEventListener("click", () => {
      const service =
        card.getAttribute("data-service") ||
        card.textContent.trim().toLowerCase();
      window.location.href = `booking.html?service=${encodeURIComponent(service)}`;
    });
  });
});

/* ==========================================================
   GEOLOCATION
   ========================================================== */
async function detectLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn("❌ Geolocation not supported.");
      return resolve(null);
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const area =
            data.address.city ||
            data.address.town ||
            data.address.state ||
            data.address.village ||
            "Unknown Area";
          resolve({ area, latitude, longitude });
        } catch (err) {
          console.warn("⚠️ Location fetch failed:", err);
          resolve(null);
        }
      },
      (err) => {
        console.warn("⚠️ Location denied:", err.message);
        resolve(null);
      }
    );
  });
}

/* ===== FIREBASE AUTH (Signup & Login) ===== */
(async function authSystem() {
  if (!window.firebaseAuth || !window.firebaseDB) return;

  const auth = window.firebaseAuth;
  const db = window.firebaseDB;
  const { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } =
    await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js");
  const { addDoc, collection, getDocs, query, where, serverTimestamp } =
    await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");

  /* ===== TOGGLE BETWEEN SIGNUP / LOGIN ===== */
  const signupBox = document.getElementById("signup-box");
  const loginBox = document.getElementById("login-box");
  const showLogin = document.getElementById("show-login");
  const showSignup = document.getElementById("show-signup");

  if (showLogin && showSignup && signupBox && loginBox) {
    showLogin.addEventListener("click", (e) => {
      e.preventDefault();
      signupBox.classList.add("hidden");
      loginBox.classList.remove("hidden");
    });
    showSignup.addEventListener("click", (e) => {
      e.preventDefault();
      loginBox.classList.add("hidden");
      signupBox.classList.remove("hidden");
    });
  }

 /* ===== SIGN UP ===== */
const signupForm = document.getElementById("signup-form");
if (signupForm) {
  const roleCheckbox = document.getElementById("signup-role");
  const techFields = document.getElementById("technician-fields");

  // Toggle technician fields
  if (roleCheckbox && techFields) {
    roleCheckbox.addEventListener("change", () => {
      techFields.classList.toggle("hidden", !roleCheckbox.checked);
    });
  }

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get form data
    let name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const isTech = document.getElementById("signup-role").checked;
    const profession = isTech
      ? document.getElementById("signup-profession").value.trim()
      : "";
    const manualLocation = isTech
      ? document.getElementById("signup-location").value.trim()
      : "";

    name = name.replace(/\b\w/g, (c) => c.toUpperCase());

    try {
      const auth = window.firebaseAuth;
      const db = window.firebaseDB;

      if (!auth || !db) {
        alert("Firebase not initialized correctly.");
        return;
      }

      // Detect location safely
      let locationData = null;
      try {
        locationData = await detectLocation();
      } catch {
        console.warn("Location detection failed, fallback to manual input.");
      }

      // Create user
      const { createUserWithEmailAndPassword } = await import(
        "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"
      );
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Save user data in Firestore
      const { addDoc, collection, serverTimestamp } = await import(
        "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"
      );

      await addDoc(collection(db, "users"), {
        uid: user.uid,
        name,
        email,
        role: isTech ? "technician" : "user",
        profession,
        location: {
          city: locationData?.area || manualLocation || "Unknown",
          lat: locationData?.latitude || null,
          lng: locationData?.longitude || null,
        },
        createdAt: serverTimestamp(),
      });

      alert("Signup successful! Redirecting...");
      window.location.href = isTech
        ? "tech-dashboard.html"
        : "dashboard.html";
    } catch (err) {
      console.error("Signup failed:", err);
      alert("Signup failed: " + err.message);
    }
  });
}


  /* ===== LOGIN ===== */
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;
      if (!email || !password) return alert("Please enter your email and password.");

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Get role from Firestore
        const q = query(collection(db, "users"), where("uid", "==", user.uid));
        const snapshot = await getDocs(q);
        const role = !snapshot.empty ? snapshot.docs[0].data().role : "user";

        alert("Login successful! Redirecting...");
        if (role === "admin") {
          window.location.href = "admin-dashboard.html";
        } else if (role === "technician") {
          window.location.href = "tech-dashboard.html";
        } else {
          window.location.href = "dashboard.html";
        }
      } catch (err) {
        console.error("❌ Login failed:", err);
        alert("Login failed: " + err.message);
      }
    });
  }

  /* ===== AUTO REDIRECT IF ALREADY LOGGED IN ===== */
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const q = query(collection(db, "users"), where("uid", "==", user.uid));
    const snapshot = await getDocs(q);
    const role = !snapshot.empty ? snapshot.docs[0].data().role : "user";

    if (window.location.pathname.endsWith("auth.html")) {
      if (role === "admin") window.location.href = "admin-dashboard.html";
      else if (role === "technician") window.location.href = "tech-dashboard.html";
      else window.location.href = "dashboard.html";
    }
  });
})();


/* ==========================================================
   LOGOUT HANDLER
   ========================================================== */
(async function logoutSystem() {
  const logoutBtn = document.getElementById("logout-btn");
  if (!logoutBtn) return;

  const { signOut } = await import(
    "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"
  );

  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(window.firebaseAuth);
      alert("You’ve been logged out.");
      window.location.href = "auth.html";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  });
})();

/* ===== HOME PAGE SEARCH HANDLER ===== */
document.addEventListener("DOMContentLoaded", () => {
  const homeSearchForm = document.getElementById("home-search-form");
  if (!homeSearchForm) return;

  homeSearchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const profession = document.getElementById("home-profession").value.trim();
    const locationInput = document.getElementById("home-location").value.trim();

    let location = locationInput;
    if (!locationInput) {
      const locData = await detectLocation();
      location = locData?.area || "unknown";
    }

    if (!profession) {
      alert("Please enter a profession (e.g. Electrician, Plumber)");
      return;
    }

    window.location.href = `technicians.html?profession=${encodeURIComponent(profession)}&location=${encodeURIComponent(location)}`;
  });
});



