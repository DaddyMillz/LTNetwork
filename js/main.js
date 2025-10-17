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
        console.log("📍 Coordinates:", latitude, longitude);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const area =
            data.address.suburb ||
            data.address.city_district ||
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.state ||
            "Unknown Area";
          console.log("📍 Detected Area:", area);
          resolve({ area, latitude, longitude });
        } catch (err) {
          console.warn("⚠️ Reverse geocoding failed:", err);
          resolve(null);
        }
      },
      (err) => {
        console.warn("⚠️ Location access denied:", err.message);
        resolve(null);
      }
    );
  });
}

// ===== INITIAL FIREBASE CHECK =====
console.log('Firebase check:', window.firebaseApp, window.firebaseAuth, window.firebaseDB);

/* ===== NAVBAR TOGGLE ===== */
const menuToggle = document.getElementById('menu-toggle');
const navbar = document.getElementById('navbar');
if (menuToggle && navbar) {
  menuToggle.addEventListener('click', () => {
    navbar.classList.toggle('active');
  });
}

/* ===== CATEGORY & SERVICE CARD CLICK FIX ===== */
document.addEventListener("DOMContentLoaded", () => {
  // Category redirect
  document.querySelectorAll(".category-card").forEach(card => {
    card.addEventListener("click", () => {
      const category = card.textContent.trim().replace(/[^\w\s]/gi, '').toLowerCase();
      window.location.href = `technicians.html?category=${encodeURIComponent(category)}`;
    });
  });

  // Service redirect
  document.querySelectorAll(".service-card").forEach(card => {
    card.addEventListener("click", () => {
      const service = card.getAttribute("data-service") || card.textContent.trim().toLowerCase();
      window.location.href = `booking.html?service=${encodeURIComponent(service)}`;
    });
  });
});

/* ===== AUTO-FILL SERVICE NAME ON BOOKING PAGE ===== */
const serviceParam = new URLSearchParams(window.location.search).get('service');
if (serviceParam) {
  const serviceTitle = document.getElementById('service-title');
  if (serviceTitle) {
    const formatted = serviceParam.charAt(0).toUpperCase() + serviceParam.slice(1);
    serviceTitle.textContent = `Book ${formatted} Service`;
  }
}

/* ===== FIREBASE AUTH (Signup & Login) ===== */
(async function authSystem() {
  if (!window.firebaseAuth || !window.firebaseDB) return;

  const auth = window.firebaseAuth;
  const db = window.firebaseDB;

  const { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } =
    await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js");
  const {
    addDoc,
    collection,
    getDocs,
    query,
    where,
    serverTimestamp
  } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");

  // ===== SIGN UP =====
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
        // Detect location first
        let locationData = await detectLocation();
        if (!locationData) {
          locationData = {
            area: manualLocation || "Unknown",
            latitude: null,
            longitude: null,
          };
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const role = isTech ? "technician" : "user";

        await addDoc(collection(db, "users"), {
          uid: user.uid,
          name,
          email,
          role,
          profession: isTech ? profession : "",
          location: {
            city: locationData.area,
            lat: locationData.latitude,
            lng: locationData.longitude,
          },
          createdAt: serverTimestamp(),
        });

        alert("Signup successful! Redirecting...");
        window.location.href = isTech ? "tech-dashboard.html" : "dashboard.html";
      } catch (err) {
        console.error("Signup failed:", err);
        alert("Signup failed: " + err.message);
      }
    });
  }

  // ===== LOGIN =====
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Fetch role for proper redirect
        const q = query(collection(db, "users"), where("uid", "==", user.uid));
        const snapshot = await getDocs(q);
        const role = snapshot.empty
          ? "user"
          : snapshot.docs[0].data().role || "user";

        alert("Login successful! Redirecting...");
        window.location.href = role === "technician" ? "tech-dashboard.html" : "dashboard.html";
      } catch (err) {
        alert("Login failed: " + err.message);
      }
    });
  }

  // ===== AUTO REDIRECT IF ALREADY LOGGED IN =====
  onAuthStateChanged(auth, (user) => {
    if (user && window.location.pathname.endsWith("auth.html")) {
      window.location.href = "dashboard.html";
    }
  });
})();

  /* ===== AUTO REDIRECT IF LOGGED IN ===== */
  onAuthStateChanged(auth, (user) => {
    if (user && window.location.pathname.endsWith("auth.html")) {
      window.location.href = "dashboard.html";
    }
  });
})();


  // ===== AUTO REDIRECT IF ALREADY LOGGED IN =====
  onAuthStateChanged(auth, user => {
    if (user && window.location.pathname.endsWith('auth.html')) {
      window.location.href = 'dashboard.html';
    }
  });
})();

/* ===== DASHBOARD PROTECTION + LOGOUT ===== */
(async function dashboardProtection() {
  if (!window.firebaseAuth) return;

  const auth = window.firebaseAuth;
  const { onAuthStateChanged, signOut } =
    await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js");

  if (window.location.pathname.endsWith('dashboard.html')) {
    onAuthStateChanged(auth, user => {
      if (!user) {
        window.location.href = 'auth.html';
      } else {
        console.log('✅ Logged in user:', user.email);
      }
    });
  }

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
})();

/* ===== DASHBOARD GREETING (Personalized Name) ===== */
(async function dashboardGreeting() {
  if (!window.firebaseAuth || !window.firebaseDB) return;

  const auth = window.firebaseAuth;
  const db = window.firebaseDB;
  const { onAuthStateChanged } =
    await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js");
  const { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } =
    await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");

  const greetingEl = document.getElementById("user-greeting");
  if (!greetingEl || !window.location.pathname.endsWith("dashboard.html")) return;

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("uid", "==", user.uid));
    const snapshot = await getDocs(q);

    let displayName = user.email.split("@")[0];
    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data();
      if (userData.name) displayName = userData.name;
    }

    displayName = displayName.replace(/\b\w/g, (c) => c.toUpperCase());
    const firstName = displayName.split(" ")[0];
    greetingEl.textContent = `👋 Welcome, ${firstName}!`;
  });
})();

/* ===== USER DASHBOARD BOOKINGS ===== */
(async function loadUserBookings() {
  if (!window.firebaseAuth || !window.firebaseDB) return;
  const auth = window.firebaseAuth;
  const db = window.firebaseDB;
  const { onAuthStateChanged } =
    await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js");
  const { collection, query, where, getDocs } =
    await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");

  const container = document.getElementById("user-bookings");
  if (!container) return;

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const bookingsRef = collection(db, "bookings");
    const q = query(bookingsRef, where("uid", "==", user.uid));
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
          <p><strong>Location:</strong> ${b.location}</p>
          <p><strong>Status:</strong> ${b.status}</p>
        </div>`;
    });
  });
})();

/* ===== BOOKING FORM ===== */
document.addEventListener("DOMContentLoaded", () => {
  const bookingForm = document.getElementById("booking-form");
  const popup = document.getElementById("success-popup");
  const closePopup = document.getElementById("close-popup");

  if (!bookingForm) return;

  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("book-name").value.trim();
    const phone = document.getElementById("book-phone").value.trim();
    const location = document.getElementById("book-location").value.trim();
    const details = document.getElementById("book-details").value.trim();
    const serviceParam = new URLSearchParams(window.location.search).get("service") || "General";

    if (!name || !phone || !location) {
      alert("Please fill in all required fields.");
      return;
    }

    const user = window.firebaseAuth.currentUser;
    if (!user) {
      alert("Please log in before booking.");
      window.location.href = "auth.html";
      return;
    }

    try {
      const { addDoc, collection, serverTimestamp } =
        await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");
      const db = window.firebaseDB;

      await addDoc(collection(db, "bookings"), {
        uid: user.uid,
        email: user.email,
        name,
        phone,
        location,
        details,
        service: serviceParam,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      console.log("✅ Booking saved successfully!");
      bookingForm.reset();
      popup.classList.remove("hidden");
    } catch (err) {
      console.error("❌ Booking save failed:", err);
      alert("Something went wrong while saving your booking.");
    }
  });

  if (closePopup) {
    closePopup.addEventListener("click", () => {
      popup.classList.add("hidden");
      window.location.href = "services.html";
    });
  }
});
