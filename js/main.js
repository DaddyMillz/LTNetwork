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

/* ===== DASHBOARD GREETING ===== */
(async function dashboardGreeting() {
  if (!window.firebaseAuth || !window.firebaseDB) return;

  const auth = window.firebaseAuth;
  const db = window.firebaseDB;
  const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js");
  const { collection, query, where, getDocs, doc, getDoc } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");

  const greetingEl = document.getElementById('user-greeting');
  if (!greetingEl || !window.location.pathname.endsWith('dashboard.html')) return;

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      let name = null;

      // 1️⃣ Try fetching Firestore document
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '==', user.uid));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        name = userData.name;
      }

      // 2️⃣ Retry if not found yet (new signup)
      if (!name) {
        console.log("⏳ Waiting for Firestore to sync user data...");
        setTimeout(async () => {
          const snapshot2 = await getDocs(q);
          if (!snapshot2.empty) {
            const userData = snapshot2.docs[0].data();
            greetingEl.textContent = `👋 Welcome, ${userData.name || user.email}!`;
          } else {
            greetingEl.textContent = `👋 Welcome, ${user.email}!`;
          }
        }, 2000); // Wait 2 seconds and retry
      } else {
        greetingEl.textContent = `👋 Welcome, ${name}!`;
      }
    }
  });
})();



