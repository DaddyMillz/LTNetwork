// ===== MOBILE MENU =====
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

// ===== FORM PLACEHOLDER (simulate login/signup) =====
document.querySelectorAll('.auth-form').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    alert('Form submitted (Firebase integration coming soon).');
  });
});

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


