import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import { app } from "./firebase-config.js";

const auth = getAuth(app);
const db = getFirestore(app);

const bookingsContainer = document.getElementById("booking-list");

// ===== LOAD TECHNICIAN BOOKINGS =====
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "auth.html";
    return;
  }

  try {
    const q = query(collection(db, "bookings"), where("technicianUID", "==", user.uid));
    const snapshot = await getDocs(q);

    let bookings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    // fallback by email
    if (bookings.length === 0) {
      const q2 = query(collection(db, "bookings"), where("technicianEmail", "==", user.email));
      const snap2 = await getDocs(q2);
      bookings = snap2.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    if (bookings.length === 0) {
      bookingsContainer.innerHTML = `<p>No bookings found for you yet.</p>`;
      return;
    }

    bookingsContainer.innerHTML = bookings
      .map(
        (b) => `
        <div class="booking-card">
          <h3>${b.service || "Service"}</h3>
          <p><strong>Client:</strong> ${b.name || "N/A"}</p>
          <p><strong>Phone:</strong> ${b.phone || "N/A"}</p>
          <p><strong>Location:</strong> ${b.location || "N/A"}</p>
          <p><strong>Status:</strong> <span class="status ${b.status}">${b.status}</span></p>
          <div>
            ${
              b.status === "pending"
                ? `<button class="accept-btn" data-id="${b.id}">Accept</button>
                   <button class="decline-btn" data-id="${b.id}">Decline</button>`
                : b.status === "accepted"
                ? `<button class="complete-btn" data-id="${b.id}">Complete</button>`
                : ""
            }
          </div>
        </div>`
      )
      .join("");

    bindActions();
  } catch (err) {
    console.error("Error loading bookings:", err);
    bookingsContainer.innerHTML = `<p class="error">Failed to load bookings.</p>`;
  }
});

function bindActions() {
  document.querySelectorAll(".accept-btn").forEach((btn) =>
    btn.addEventListener("click", () => updateStatus(btn.dataset.id, "accepted"))
  );
  document.querySelectorAll(".decline-btn").forEach((btn) =>
    btn.addEventListener("click", () => updateStatus(btn.dataset.id, "declined"))
  );
  document.querySelectorAll(".complete-btn").forEach((btn) =>
    btn.addEventListener("click", () => updateStatus(btn.dataset.id, "completed"))
  );
}

async function updateStatus(id, status) {
  const ref = doc(db, "bookings", id);
  await updateDoc(ref, { status });
  alert(`Booking marked as ${status}`);
  location.reload();
}


/* ===== NAVBAR TOGGLE ===== */
const menuToggle = document.getElementById("menu-toggle");
const navbar = document.getElementById("navbar");
if (menuToggle && navbar) {
  menuToggle.addEventListener("click", () => {
    navbar.classList.toggle("active");
  });
}

/* ===== LOGOUT ===== */
if (logoutBtn) {
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
      alert("Logged out successfully!");
      window.location.href = "auth.html";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  });
}

/* ===== LOAD BOOKINGS FOR TECHNICIAN ===== */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "auth.html";
    return;
  }

  bookingsContainer.innerHTML = `<p class="loading">Loading your bookings...</p>`;

  try {
    const q = query(collection(db, "bookings"), where("technicianUID", "==", user.uid));
    const snapshot = await getDocs(q);

    let bookings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    // fallback — match by email too
    if (bookings.length === 0) {
      const q2 = query(collection(db, "bookings"), where("technicianEmail", "==", user.email));
      const snap2 = await getDocs(q2);
      bookings = snap2.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    if (bookings.length === 0) {
      bookingsContainer.innerHTML = `<p>No bookings found for you yet.</p>`;
      return;
    }

    bookingsContainer.innerHTML = bookings
      .map(
        (b) => `
        <div class="booking-card fade-in">
          <h3>${b.service || "Service"}</h3>
          <p><strong>Client:</strong> ${b.name || "N/A"}</p>
          <p><strong>Phone:</strong> ${b.phone || "N/A"}</p>
          <p><strong>Location:</strong> ${b.location || "N/A"}</p>
          <p><strong>Details:</strong> ${b.details || "N/A"}</p>
          <p><strong>Status:</strong> <span class="status ${b.status}">${b.status}</span></p>

          <div class="booking-actions">
            ${
              b.status === "pending"
                ? `
              <button class="accept-btn" data-id="${b.id}">Accept</button>
              <button class="decline-btn" data-id="${b.id}">Decline</button>
            `
                : b.status === "accepted"
                ? `<button class="complete-btn" data-id="${b.id}">Mark as Complete</button>`
                : ""
            }
          </div>
        </div>`
      )
      .join("");

    bindBookingActions();
  } catch (err) {
    console.error("❌ Error loading bookings:", err);
    bookingsContainer.innerHTML = `<p class="error">Failed to load bookings. Try again later.</p>`;
  }
});

/* ===== HANDLE BOOKING ACTIONS ===== */
function bindBookingActions() {
  document.querySelectorAll(".accept-btn").forEach((btn) =>
    btn.addEventListener("click", async () => updateBookingStatus(btn.dataset.id, "accepted"))
  );
  document.querySelectorAll(".decline-btn").forEach((btn) =>
    btn.addEventListener("click", async () => updateBookingStatus(btn.dataset.id, "declined"))
  );
  document.querySelectorAll(".complete-btn").forEach((btn) =>
    btn.addEventListener("click", async () => updateBookingStatus(btn.dataset.id, "completed"))
  );
}

/* ===== UPDATE BOOKING STATUS ===== */
async function updateBookingStatus(id, status) {
  try {
    const ref = doc(db, "bookings", id);
    await updateDoc(ref, { status });
    alert(`Booking marked as ${status}.`);
    location.reload();
  } catch (err) {
    console.error("Failed to update booking:", err);
    alert("Failed to update booking.");
  }
}
