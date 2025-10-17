// ===== MOBILE MENU =====
console.log('Firebase check:', window.firebaseApp, window.firebaseAuth, window.firebaseDB);

const menuToggle = document.getElementById('menu-toggle');
const navbar = document.getElementById('navbar');
if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    navbar.classList.toggle('active');
  });
}

// ===== SEARCH FUNCTION =====
const searchForms = document.querySelectorAll('.search-bar, .filter-bar');
searchForms.forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const category = form.querySelector('select').value;
    const location = form.querySelector('input').value;
    alert(`Searching for ${category} technicians in ${location}...`);
  });
});

// ===== AUTH TOGGLE =====
const signupBox = document.getElementById('signup-box');
const loginBox = document.getElementById('login-box');
const showLogin = document.getElementById('show-login');
const showSignup = document.getElementById('show-signup');

if (showLogin && showSignup) {
  showLogin.addEventListener('click', e => {
    e.preventDefault();
    signupBox.classList.add('hidden');
    loginBox.classList.remove('hidden');
  });

  showSignup.addEventListener('click', e => {
    e.preventDefault();
    loginBox.classList.add('hidden');
    signupBox.classList.remove('hidden');
  });
}


// ===== CATEGORY CLICK REDIRECT =====
document.querySelectorAll('.category-card').forEach(card => {
  card.addEventListener('click', () => {
    // get category name (e.g. "Electrical" or "Plumbing")
    const category = card.textContent.trim().replace(/[^\w\s]/gi, '').toLowerCase();
    // redirect to technicians page with query parameter
    window.location.href = `technicians.html?category=${encodeURIComponent(category)}`;
  });
});

// ===== FILTER TECHNICIANS BY CATEGORY (with animation + fallback) =====
function getQueryParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

const categoryParam = getQueryParam('category');
if (categoryParam) {
    const resetBtn = document.getElementById('reset-filter');
  if (resetBtn) resetBtn.style.display = 'inline-block';
  const cards = document.querySelectorAll('.tech-card');
  const formattedCategory = categoryParam.toLowerCase();
  let matchCount = 0;

  cards.forEach(card => {
    const cardCategory = card.getAttribute('data-category').toLowerCase();
    if (!cardCategory.includes(formattedCategory)) {
      card.style.display = 'none';
    } else {
      matchCount++;
      card.classList.add('fade-in');
    }
  });

  const heading = document.querySelector('.technicians h3');
  if (heading)
    heading.textContent = `Showing ${categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1)} Technicians`;

  // No results message
  if (matchCount === 0) {
    const container = document.querySelector('.tech-grid');
    const msg = document.createElement('p');
    msg.className = 'no-results';
    msg.textContent = `No technicians found for "${categoryParam}".`;
    container.appendChild(msg);
  }
}

// ===== RESET FILTER =====
const resetBtn = document.getElementById('reset-filter');
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    window.location.href = 'technicians.html';
  });
}

// ===== SERVICE CARD CLICK REDIRECT =====
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('click', () => {
    const service = card.getAttribute('data-service');
    window.location.href = `technicians.html?category=${encodeURIComponent(service)}`;
  });
});

// ===== SERVICE BOOKING REDIRECT =====
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('click', () => {
    const service = card.getAttribute('data-service');
    window.location.href = `booking.html?service=${encodeURIComponent(service)}`;
  });
});

// ===== AUTO-FILL SERVICE NAME ON BOOKING PAGE =====
const serviceParam = new URLSearchParams(window.location.search).get('service');
if (serviceParam) {
  const serviceTitle = document.getElementById('service-title');
  if (serviceTitle) {
    const formatted = serviceParam.charAt(0).toUpperCase() + serviceParam.slice(1);
    serviceTitle.textContent = `Book ${formatted} Service`;
  }
}

// ===== BOOKING FORM SUBMISSION WITH POPUP =====
const bookingForm = document.getElementById('booking-form');
const popup = document.getElementById('success-popup');
const closePopup = document.getElementById('close-popup');

if (bookingForm) {
  bookingForm.addEventListener('submit', e => {
    e.preventDefault();

    // simulate booking submission
    bookingForm.reset();

    // show popup
    popup.classList.remove('hidden');
  });
}

if (closePopup) {
  closePopup.addEventListener('click', () => {
    popup.classList.add('hidden');
    // redirect back to Services or home if desired
    window.location.href = 'services.html';
  });
}

/* ===== FIREBASE AUTH (Signup & Login) ===== */
(async function authSystem() {
  if (!window.firebaseAuth || !window.firebaseDB) return;

  const auth = window.firebaseAuth;
  const db = window.firebaseDB;
  const { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged 
  } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js");
  const { addDoc, collection, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");

  // ===== SIGN UP =====
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save user data to Firestore
        console.log("⚙️ Trying to save user:", name, email);
        await addDoc(collection(db, 'users'), {
          uid: user.uid,
          name,
          email,
          role: 'user',
          createdAt: serverTimestamp()
        });
console.log("✅ Firestore user saved:", name, email);

        alert('Signup successful! Redirecting...');
setTimeout(() => {
  window.location.href = 'dashboard.html';
}, 1000);

      } catch (err) {
        alert('Signup failed: ' + err.message);
      }
    });
  }

  // ===== LOGIN =====
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      try {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Login successful! Redirecting to dashboard...');
        window.location.href = 'dashboard.html';
      } catch (err) {
        alert('Login failed: ' + err.message);
      }
    });
  }

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
  const { onAuthStateChanged, signOut } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js");

  // Protect dashboard
  if (window.location.pathname.endsWith('dashboard.html')) {
    onAuthStateChanged(auth, user => {
      if (!user) {
        // Not signed in → redirect to login
        window.location.href = 'auth.html';
      } else {
        console.log('✅ Logged in user:', user.email);
      }
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await signOut(auth);
      alert('You have been logged out.');
      window.location.href = 'auth.html';
    });
  }
})();

/* ===== ENSURE FIRESTORE USER RECORD EXISTS ===== */
(async function ensureUserRecord() {
  if (!window.firebaseAuth || !window.firebaseDB) return;

  const auth = window.firebaseAuth;
  const db = window.firebaseDB;
  const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js");
  const { collection, query, where, getDocs, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '==', user.uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log("🆕 Firestore record missing — creating new one for", user.email);
      await addDoc(usersRef, {
        uid: user.uid,
        name: user.displayName || "", // optional, can be empty
        email: user.email,
        role: 'user',
        createdAt: serverTimestamp(),
      });
      console.log("✅ Firestore record created for:", user.email);
    } else {
      console.log("✅ Firestore record already exists for:", user.email);
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

  const greetingEl = document.getElementById('user-greeting');
  if (!greetingEl || !window.location.pathname.endsWith('dashboard.html')) return;

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("👤 Logged in user:", user.email, "UID:", user.uid);

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '==', user.uid));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        const name =
          userData.name && userData.name.trim() !== ""
            ? userData.name
            : user.email.split("@")[0]; // fallback to first part of email
        greetingEl.textContent = `👋 Welcome, ${name}!`;
      } else {
        const fallbackName = user.email.split("@")[0];
        greetingEl.textContent = `👋 Welcome, ${fallbackName}!`;
      }
    }
  });
})();

/* ===== FIREBASE BOOKING FORM (Final Reliable Version) ===== */
(async function bookingSystem() {
  if (!window.firebaseAuth || !window.firebaseDB) return;

  const auth = window.firebaseAuth;
  const db = window.firebaseDB;
  const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js");
  const { addDoc, collection, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");

  const bookingForm = document.getElementById('booking-form');
  const popup = document.getElementById('success-popup');
  const closePopup = document.getElementById('close-popup');

  if (!bookingForm) return;

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      bookingForm.addEventListener('submit', e => {
        e.preventDefault();
        alert('Please log in to make a booking.');
        window.location.href = 'auth.html';
      });
      return;
    }

    console.log("✅ Auth ready. Booking allowed for:", user.email);

    bookingForm.addEventListener('submit', async e => {
      e.preventDefault();

      // Small delay to ensure DOM fields are readable
      await new Promise(r => setTimeout(r, 100));

      const nameInput = document.getElementById('book-name');
      const phoneInput = document.getElementById('book-phone');
      const locationInput = document.getElementById('book-location');
      const detailsInput = document.getElementById('book-details');

      if (!nameInput || !phoneInput || !locationInput || !detailsInput) {
        console.error("❌ Missing one or more form fields in the DOM");
        alert("Form fields not found. Please refresh the page and try again.");
        return;
      }

      const name = nameInput.value.trim();
      const phone = phoneInput.value.trim();
      const location = locationInput.value.trim();
      const details = detailsInput.value.trim();
      const serviceParam = new URLSearchParams(window.location.search).get('service') || "General";

      console.log("🧩 Form Data Collected:", { name, phone, location, details, serviceParam });

      if (!name || !phone || !location || !details) {
        alert("Please fill in all fields before submitting.");
        return;
      }

      try {
        const docRef = await addDoc(collection(db, 'bookings'), {
          uid: user.uid,
          name,
          email: user.email,
          phone,
          location,
          details,
          service: serviceParam,
          status: 'pending',
          createdAt: serverTimestamp()
        });

        console.log("✅ Booking saved successfully:", docRef.id);
        bookingForm.reset();
        popup.classList.remove('hidden');
      } catch (err) {
        console.error("❌ Firestore booking error:", err);
        alert("Error saving booking: " + err.message);
      }
    });

    if (closePopup) {
      closePopup.addEventListener('click', () => {
        popup.classList.add('hidden');
        window.location.href = 'dashboard.html';
      });
    }
  });
})();

