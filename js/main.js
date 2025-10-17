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
    const category = card.textContent.trim().replace(/[^\w\s]/gi, '').toLowerCase();
    window.location.href = `technicians.html?category=${encodeURIComponent(category)}`;
  });
});

// ===== FILTER TECHNICIANS BY CATEGORY =====
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

/* ===== FIREBASE AUTH (Signup & Login) ===== */
(async function authSystem() {
  if (!window.firebaseAuth || !window.firebaseDB) return;

  const auth = window.firebaseAuth;
  const db = window.firebaseDB;
  const { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js");
  const { addDoc, collection, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");

// ===== SIGN UP =====
const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async e => {
    e.preventDefault();
    let name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    // Capitalize first letter of each word
    name = name.replace(/\b\w/g, c => c.toUpperCase());

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save to Firestore
      console.log("⚙️ Saving user:", name, email);
 // Save user data to Firestore (or update if exists)
const { getDocs, query, where, updateDoc } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");
const usersRef = collection(db, "users");
const q = query(usersRef, where("uid", "==", user.uid));
const snapshot = await getDocs(q);

if (snapshot.empty) {
  await addDoc(usersRef, {
    uid: user.uid,
    name,
    email,
    role: "user",
    createdAt: serverTimestamp()
  });
  console.log("✅ Firestore user created:", name, email);
} else {
  const docRef = snapshot.docs[0].ref;
  await updateDoc(docRef, { name });
  console.log("🔄 Firestore user name updated:", name);
}


      alert('Signup successful! Redirecting...');
      setTimeout(() => (window.location.href = 'dashboard.html'), 1000);

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
      await signOut(auth);
      alert('You have been logged out.');
      window.location.href = 'auth.html';
    });
  }
})();

/* ===== DASHBOARD GREETING (First Name Only) ===== */
(async function dashboardGreeting() {
  if (!window.firebaseAuth || !window.firebaseDB) return;

  const auth = window.firebaseAuth;
  const db = window.firebaseDB;
  const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js");
  const { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } =
    await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");

  const greetingEl = document.getElementById("user-greeting");
  if (!greetingEl || !window.location.pathname.endsWith("dashboard.html")) return;

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    console.log("👤 Logged in user:", user.email, "UID:", user.uid);

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("uid", "==", user.uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log("🆕 User not found in Firestore — creating record.");
      const guessedName = user.email.split("@")[0].replace(/\b\w/g, (c) => c.toUpperCase());
      await addDoc(collection(db, "users"), {
        uid: user.uid,
        name: guessedName,
        email: user.email,
        role: "user",
        createdAt: serverTimestamp(),
      });
      greetingEl.textContent = `👋 Welcome, ${guessedName.split(" ")[0]}!`;
    } else {
      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      let displayName = userData.name?.trim();
      if (!displayName) {
        displayName = user.email.split("@")[0];
        displayName = displayName.replace(/\b\w/g, (c) => c.toUpperCase());
        await updateDoc(doc(db, "users", userDoc.id), { name: displayName });
      } else {
        displayName = displayName.replace(/\b\w/g, (c) => c.toUpperCase());
      }

      // 👇 Use only the first word (first name)
      const firstName = displayName.split(" ")[0];
      greetingEl.textContent = `👋 Welcome, ${firstName}!`;
    }
  });
})();


/* ===== BOOKING FORM ===== */
document.addEventListener("DOMContentLoaded", () => {
  const bookingForm = document.getElementById('booking-form');
  if (!bookingForm) return;

  bookingForm.addEventListener('submit', async e => {
    e.preventDefault();

    const name = document.getElementById('book-name').value.trim();
    const phone = document.getElementById('book-phone').value.trim();
    const location = document.getElementById('book-location').value.trim();
    const details = document.getElementById('book-details').value.trim();
    const serviceParam = new URLSearchParams(window.location.search).get('service') || 'General';

    if (!name || !phone || !location) {
      alert("Please fill in all fields before submitting.");
      return;
    }

    try {
      const user = window.firebaseAuth.currentUser;
      if (!user) {
        alert("Please log in before booking.");
        window.location.href = "auth.html";
        return;
      }

      console.log("✅ Auth ready. Booking allowed for:", user.email);

      const { addDoc, collection, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");
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
        createdAt: serverTimestamp()
      });

      console.log("✅ Booking saved successfully!");
      bookingForm.reset();
      document.getElementById("success-popup").classList.remove("hidden");
    } catch (err) {
      console.error("❌ Booking save failed:", err);
      alert("Something went wrong while saving your booking.");
    }
  });
});
