/* =========================================
   ADMIN DASHBOARD - Local Technician Network
   ========================================= */
console.log("✅ Admin script loaded");

/* ===== FIREBASE INITIALIZATION ===== */
if (!window.firebaseAuth || !window.firebaseDB) {
  console.error("❌ Firebase not initialized!");
}

/* ===== AUTHENTICATION GUARD (Admin Only on Admin Page) ===== */
(async function adminAuthGuard() {
  // Only run this check on admin dashboard page
  if (!window.location.pathname.endsWith("admin-dashboard.html")) return;

  const { onAuthStateChanged, signOut } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js");
  const auth = window.firebaseAuth;

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("You must be logged in as an admin to access this page.");
      window.location.href = "auth.html";
      return;
    }

    // Allow only authorized admin emails
    const adminEmails = ["admin@localtech.com", "superadmin@gmail.com"];
    if (!adminEmails.includes(user.email)) {
      alert("Access denied. Admins only.");
      await signOut(auth);
      window.location.href = "auth.html";
      return;
    }

    document.getElementById("admin-name").textContent = user.email.split("@")[0];
    console.log("✅ Admin logged in:", user.email);
  });

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      alert("Logged out successfully.");
      window.location.href = "auth.html";
    });
  }
})();


/* ===== LOCATION DETECTION ===== */
async function detectLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn("❌ Geolocation not supported. Using fallback.");
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
            (data && data.address && (
              data.address.suburb ||
              data.address.city_district ||
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.state
            )) || "Unknown Area";
          resolve({ area, latitude, longitude });
        } catch (err) {
          console.warn("⚠️ Reverse geocoding failed:", err);
          resolve({ area: "Unknown", latitude, longitude });
        }
      },
      (err) => {
        console.warn("⚠️ Location access denied:", err.message);
        resolve(null);
      },
      { timeout: 10000 }
    );
  });
}

/* ===== INITIAL FIREBASE CHECK ===== */
console.log('Firebase check:', window.firebaseApp, window.firebaseAuth, window.firebaseDB);

/* ===== NAVBAR TOGGLE, CATEGORY & SERVICE CLICKS ===== */
document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById('menu-toggle');
  const navbar = document.getElementById('navbar');
  if (menuToggle && navbar) {
    menuToggle.addEventListener('click', () => navbar.classList.toggle('active'));
  }

  document.querySelectorAll(".category-card").forEach(card => {
    card.addEventListener("click", () => {
      const category = card.textContent.trim().replace(/[^\w\s]/gi, '').toLowerCase();
      window.location.href = `technicians.html?category=${encodeURIComponent(category)}`;
    });
  });

  document.querySelectorAll(".service-card").forEach(card => {
    card.addEventListener("click", () => {
      const service = card.getAttribute("data-service") || card.textContent.trim().toLowerCase();
      // prefer booking page so user can provide details
      window.location.href = `booking.html?service=${encodeURIComponent(service)}`;
    });
  });
});

/* ===== AUTO-FILL SERVICE NAME ON BOOKING PAGE ===== */
(function fillServiceTitle(){
  const serviceParam = new URLSearchParams(window.location.search).get('service');
  if (!serviceParam) return;
  const serviceTitle = document.getElementById('service-title');
  if (serviceTitle) {
    const formatted = serviceParam.charAt(0).toUpperCase() + serviceParam.slice(1);
    serviceTitle.textContent = `Book ${formatted} Service`;
  }
})();

/* ===== FIREBASE AUTH SYSTEM (Signup, Login & Auto Redirect) ===== */
(async function authSystem() {
  if (!window.firebaseAuth || !window.firebaseDB) return;

  // === Initialize Firebase Services ===
  const auth = window.firebaseAuth;
  const db = window.firebaseDB;

  const {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged
  } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js");

  const {
    addDoc,
    collection,
    getDocs,
    query,
    where,
    serverTimestamp
  } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");

  /* ==============================
     AUTH FORM TOGGLE (SignUp/Login)
  ============================== */
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

  /* ==============================
     SIGNUP SYSTEM
  ============================== */
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    const roleCheckbox = document.getElementById("signup-role");
    const techFields = document.getElementById("technician-fields");

    // Show/hide technician fields dynamically
    if (roleCheckbox && techFields) {
      roleCheckbox.addEventListener("change", () => {
        techFields.classList.toggle("hidden", !roleCheckbox.checked);
      });
    }

    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Collect form inputs
      const nameInput = document.getElementById("signup-name");
      const emailInput = document.getElementById("signup-email");
      const passwordInput = document.getElementById("signup-password");
      const professionInput = document.getElementById("signup-profession");
      const locationInput = document.getElementById("signup-location");

      let name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const isTechnician = roleCheckbox?.checked || false;

      // Capitalize full name
      name = name.replace(/\b\w/g, (c) => c.toUpperCase());

      try {
        // Try to auto-detect location
        let locationData = await detectLocation();
        if (!locationData) {
          locationData = {
            area: locationInput?.value.trim() || "Unknown",
            latitude: null,
            longitude: null
          };
        }

        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store user data in Firestore
        await addDoc(collection(db, "users"), {
          uid: user.uid,
          name,
          email,
          role: isTechnician ? "technician" : "user",
          profession: isTechnician ? professionInput?.value.trim() || "" : "",
          location: {
            city: locationData.area,
            lat: locationData.latitude,
            lng: locationData.longitude
          },
          createdAt: serverTimestamp()
        });

        alert("Signup successful! Redirecting...");
        window.location.href = isTechnician ? "tech-dashboard.html" : "dashboard.html";
      } catch (error) {
        console.error("❌ Signup failed:", error);
        alert("Signup failed: " + error.message);
      }
    });
  }

  /* ==============================
     LOGIN SYSTEM
  ============================== */
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      if (!email || !password) {
        alert("Please enter your email and password.");
        return;
      }

      try {
        // Sign in user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Fetch user role from Firestore
        const q = query(collection(db, "users"), where("uid", "==", user.uid));
        const snapshot = await getDocs(q);

        let role = "user";
        if (!snapshot.empty) {
          role = snapshot.docs[0].data().role || "user";
        }

        alert("Login successful! Redirecting...");
        if (role === "admin") {
          window.location.href = "admin-dashboard.html";
        } else if (role === "technician") {
          window.location.href = "tech-dashboard.html";
        } else {
          window.location.href = "dashboard.html";
        }
      } catch (error) {
        console.error("❌ Login failed:", error);
        alert("Login failed: " + error.message);
      }
    });
  }

  /* ==============================
     AUTO REDIRECT IF LOGGED IN
  ============================== */
  onAuthStateChanged(auth, (user) => {
    if (user && window.location.pathname.endsWith("auth.html")) {
      window.location.href = "dashboard.html";
    }
  });
})();


/* ===== DASHBOARD PROTECTION + LOGOUT + ROLE CHECK ===== */
(async function dashboardProtection() {
  if (!window.firebaseAuth || !window.firebaseDB) return;
  const auth = window.firebaseAuth;
  const db = window.firebaseDB;

  const { onAuthStateChanged, signOut } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js");
  const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");

  // attach logout if present
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
        alert('You have been logged out.');
        window.location.href = 'auth.html';
      } catch (err) {
        console.error("Logout failed:", err);
      }
    });
  }

  // Protect pages and redirect by role
  onAuthStateChanged(auth, async (user) => {
    const path = window.location.pathname;

    // if on either dashboard pages, ensure correct role
    if (user && (path.endsWith("dashboard.html") || path.endsWith("tech-dashboard.html"))) {
      const q = query(collection(db, "users"), where("uid", "==", user.uid));
      const snapshot = await getDocs(q);
      const role = snapshot.empty ? "user" : (snapshot.docs[0].data().role || "user");

      if (path.endsWith("dashboard.html") && role === "technician") {
        // technician shouldn't use user dashboard — send to tech dashboard
        window.location.href = "tech-dashboard.html";
      } else if (path.endsWith("tech-dashboard.html") && role !== "technician") {
        // non-tech shouldn't use tech dashboard
        window.location.href = "dashboard.html";
      }
    } else if (!user && (path.endsWith("dashboard.html") || path.endsWith("tech-dashboard.html"))) {
      // not signed in — send to auth
      window.location.href = "auth.html";
    }
  });
})();

/* ===== DASHBOARD GREETING ===== */
(async function dashboardGreeting() {
  if (!window.firebaseAuth || !window.firebaseDB) return;
  const auth = window.firebaseAuth;
  const db = window.firebaseDB;

  const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js");
  const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");

  const userGreetingEl = document.getElementById("user-greeting");
  const techGreetingEl = document.getElementById("tech-greeting");
  if (!userGreetingEl && !techGreetingEl) return;

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const q = query(collection(db, "users"), where("uid", "==", user.uid));
    const snapshot = await getDocs(q);

    let displayName = user.email.split("@")[0];
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      if (data.name) displayName = data.name;
    }

    displayName = displayName.replace(/\b\w/g, c => c.toUpperCase());
    const firstName = displayName.split(" ")[0];

    if (userGreetingEl) userGreetingEl.textContent = `👋 Welcome, ${firstName}!`;
    if (techGreetingEl) techGreetingEl.textContent = `👋 Welcome, ${firstName}!`;
  });
})();

/* ===== USER DASHBOARD BOOKINGS ===== */
(async function loadUserBookings() {
  if (!window.firebaseAuth || !window.firebaseDB) return;
  const auth = window.firebaseAuth;
  const db = window.firebaseDB;

  const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js");
  const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");

  const container = document.getElementById("user-bookings");
  if (!container) return;

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const q = query(collection(db, "bookings"), where("uid", "==", user.uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      container.innerHTML = "<p>You have no bookings yet.</p>";
      return;
    }

    container.innerHTML = "";
    snapshot.forEach(doc => {
      const b = doc.data();
      container.innerHTML += `
        <div class="booking-card">
          <h3>${b.service}</h3>
          <p><strong>Location:</strong> ${b.location || "Unknown"}</p>
          <p><strong>Status:</strong> ${b.status}</p>
        </div>`;
    });
  });
})();

/* ===== TECHNICIAN DASHBOARD: PENDING JOBS NEARBY ===== */
(async function loadTechJobs() {
  if (!window.firebaseAuth || !window.firebaseDB) return;
  const auth = window.firebaseAuth;
  const db = window.firebaseDB;

  const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js");
  const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");

  const container = document.getElementById("job-list");
  if (!container) return;

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    // get technician record
    const usersRef = collection(db, "users");
    const uq = query(usersRef, where("uid", "==", user.uid));
    const usnap = await getDocs(uq);
    if (usnap.empty) {
      container.innerHTML = "<p>No technician profile found.</p>";
      return;
    }
    const tech = usnap.docs[0].data();
    const techCity = (tech.location && tech.location.city || "").toLowerCase();

    // show pending bookings in same city
    const bq = query(collection(db, "bookings"), where("status", "==", "pending"));
    const bsnap = await getDocs(bq);

    const matches = bsnap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(b => (b.location || "").toLowerCase().includes(techCity) || !techCity);

    if (!matches.length) {
      container.innerHTML = "<p>No pending jobs in your area.</p>";
      return;
    }

    container.innerHTML = "";
    matches.forEach(job => {
      container.innerHTML += `
        <div class="booking-card">
          <h3>${job.service}</h3>
          <p><strong>Client:</strong> ${job.email}</p>
          <p><strong>Location:</strong> ${job.location || "Unknown"}</p>
          <p><strong>Details:</strong> ${job.details || ""}</p>
          <p><strong>Status:</strong> ${job.status}</p>
        </div>`;
    });
  });
})();

/* ===== BOOKING FORM (auto location fallback) ===== */
document.addEventListener("DOMContentLoaded", () => {
  const bookingForm = document.getElementById("booking-form");
  const popup = document.getElementById("success-popup");
  const closePopup = document.getElementById("close-popup");
  if (!bookingForm) return;

  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("book-name").value.trim();
    const phone = document.getElementById("book-phone").value.trim();
    let locationInput = document.getElementById("book-location").value.trim();
    const details = document.getElementById("book-details").value.trim();
    const serviceParam = new URLSearchParams(window.location.search).get("service") || "General";

    if (!name || !phone) {
      alert("Please fill in name and phone.");
      return;
    }

    try {
      // detect if no manual location
      if (!locationInput) {
        const detected = await detectLocation();
        locationInput = detected ? detected.area : "Unknown";
      }

      const user = window.firebaseAuth.currentUser;
      if (!user) {
        alert("Please log in before booking.");
        window.location.href = "auth.html";
        return;
      }

      const { addDoc, collection, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");
      const db = window.firebaseDB;

      await addDoc(collection(db, "bookings"), {
        uid: user.uid,
        email: user.email,
        name,
        phone,
        location: locationInput,
        details,
        service: serviceParam,
        status: "pending",
        createdAt: serverTimestamp()
      });

      bookingForm.reset();
      if (popup) popup.classList.remove("hidden");
      console.log("✅ Booking saved successfully!");
    } catch (err) {
      console.error("❌ Booking save failed:", err);
      alert("Something went wrong while saving your booking.");
    }
  });

  if (closePopup) closePopup.addEventListener("click", () => {
    const popup = document.getElementById("success-popup");
    if (popup) popup.classList.add("hidden");
    window.location.href = "services.html";
  });
});

/* ===== TECHNICIAN SEARCH (profession + detected/manual location) ===== */
(async function technicianSearch() {
  if (!window.firebaseDB) return;
  const db = window.firebaseDB;
  const searchForm = document.getElementById("search-form");
  const resultsContainer = document.getElementById("tech-results");
  if (!searchForm || !resultsContainer) return;

  const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");

  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const service = document.getElementById("search-service").value.trim().toLowerCase();
    const areaInput = document.getElementById("search-location").value.trim();
    let userArea = areaInput;

    if (!service) {
      alert("Please enter the service/profession you're looking for.");
      return;
    }

    // attempt auto-detect if area not provided
    if (!userArea) {
      const detected = await detectLocation();
      userArea = detected ? detected.area : "";
    }

    resultsContainer.innerHTML = "<p>Searching...</p>";

    try {
      const snapshot = await getDocs(collection(db, "users"));
      const matches = snapshot.docs
        .map(d => d.data())
        .filter(u =>
          u.role === "technician" &&
          (u.profession || "").toLowerCase().includes(service) &&
          ((u.location && u.location.city && userArea && u.location.city.toLowerCase().includes(userArea.toLowerCase())) || !userArea)
        );

      if (!matches.length) {
        resultsContainer.innerHTML = "<p>No technicians found for your search.</p>";
        return;
      }

      resultsContainer.innerHTML = "";
      matches.forEach(t => {
        resultsContainer.innerHTML += `
          <div class="tech-card">
            <h3>${t.name}</h3>
            <p><strong>Profession:</strong> ${t.profession || "—"}</p>
            <p><strong>Location:</strong> ${t.location?.city || "Unknown"}</p>
            <p><strong>Contact:</strong> ${t.email || "—"}</p>
            <button class="btn-login" onclick="window.location.href='booking.html?service=${encodeURIComponent(t.profession || 'General')}'">
              Book Now
            </button>
          </div>
        `;
      });
    } catch (err) {
      console.error("Search failed:", err);
      resultsContainer.innerHTML = "<p>Search failed. Try again.</p>";
    }
  });
})();

