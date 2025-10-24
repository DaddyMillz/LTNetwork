/* ===============================
   ADMIN DASHBOARD MAIN SCRIPT
   =============================== */
import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const totalUsersEl = document.getElementById("total-users");
const totalTechsEl = document.getElementById("total-technicians");
const totalBookingsEl = document.getElementById("total-bookings");
const pendingBookingsEl = document.getElementById("pending-bookings");
const usersList = document.getElementById("users-list");
const bookingsList = document.getElementById("bookings-list");
const logoutBtn = document.getElementById("logout-btn");

/* ===============================
   LOAD DASHBOARD STATS
   =============================== */
async function loadStats() {
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const techSnap = await getDocs(
      query(collection(db, "users"), where("role", "==", "technician"))
    );
    const bookingSnap = await getDocs(collection(db, "bookings"));
    const pendingSnap = await getDocs(
      query(collection(db, "bookings"), where("status", "==", "pending"))
    );

    totalUsersEl.textContent = usersSnap.size;
    totalTechsEl.textContent = techSnap.size;
    totalBookingsEl.textContent = bookingSnap.size;
    pendingBookingsEl.textContent = pendingSnap.size;
  } catch (err) {
    console.error("Error loading stats:", err);
  }
}

/* ===============================
   LOAD USERS & TECHNICIANS
   =============================== */
async function loadUsers() {
  if (!usersList) return;
  usersList.innerHTML = `<tr><td colspan="6">Loading users...</td></tr>`;

  try {
    const snapshot = await getDocs(collection(db, "users"));
    if (snapshot.empty) {
      usersList.innerHTML = `<tr><td colspan="6">No users found.</td></tr>`;
      return;
    }

    usersList.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${data.name || "N/A"}</td>
        <td>${data.email || "N/A"}</td>
        <td>${data.role || "N/A"}</td>
        <td>${data.profession || "-"}</td>
        <td>${data.location?.city || "Unknown"}</td>
        <td><button class="delete-user" data-id="${docSnap.id}">Delete</button></td>
      `;
      usersList.appendChild(row);
    });

    document.querySelectorAll(".delete-user").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (confirm("Delete this user?")) {
          await updateDoc(doc(db, "users", btn.dataset.id), { role: "deleted" });
          alert("User marked as deleted.");
          loadUsers();
          loadStats();
        }
      })
    );
  } catch (err) {
    console.error("Error loading users:", err);
  }
}

/* ===============================
   LOAD BOOKINGS + ADMIN ACTIONS
   =============================== */
async function loadBookings() {
  if (!bookingsList) return;
  bookingsList.innerHTML = `<tr><td colspan="5">Loading bookings...</td></tr>`;

  try {
    const snapshot = await getDocs(collection(db, "bookings"));
    if (snapshot.empty) {
      bookingsList.innerHTML = `<tr><td colspan="5">No bookings found.</td></tr>`;
      return;
    }

    bookingsList.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${data.service || "N/A"}</td>
        <td>${data.name || "N/A"}<br><small>${data.email || ""}</small></td>
        <td>${data.location || "N/A"}</td>
        <td class="status ${data.status || ""}">${data.status || "N/A"}</td>
        <td>
          ${
            data.status === "pending-assignment"
              ? `<button class="assign-btn" data-id="${docSnap.id}">Assign</button>`
              : data.status === "pending"
              ? `<button class="cancel-btn" data-id="${docSnap.id}">Cancel</button>`
              : `<span>-</span>`
          }
        </td>
      `;
      bookingsList.appendChild(row);
    });

    bindBookingActions();
  } catch (err) {
    console.error("Error loading bookings:", err);
  }
}

/* ===============================
   ASSIGN / CANCEL BOOKINGS
   =============================== */
async function assignBooking(id) {
  const techEmail = prompt("Enter technician email to assign:");
  if (!techEmail) return;

  try {
    const q = query(
      collection(db, "users"),
      where("email", "==", techEmail),
      where("role", "==", "technician")
    );
    const techSnap = await getDocs(q);
    if (techSnap.empty) return alert("Technician not found.");

    const techData = techSnap.docs[0].data();
    await updateDoc(doc(db, "bookings", id), {
      technicianEmail: techData.email,
      technicianUID: techData.uid,
      status: "pending",
    });
    alert(`Assigned to ${techData.name}`);
    loadBookings();
    loadStats();
  } catch (err) {
    console.error("Error assigning booking:", err);
  }
}

async function cancelBooking(id) {
  if (!confirm("Cancel this booking?")) return;
  try {
    await updateDoc(doc(db, "bookings", id), { status: "cancelled" });
    alert("Booking cancelled.");
    loadBookings();
    loadStats();
  } catch (err) {
    console.error("Error cancelling booking:", err);
  }
}

function bindBookingActions() {
  document.querySelectorAll(".assign-btn").forEach((btn) =>
    btn.addEventListener("click", () => assignBooking(btn.dataset.id))
  );
  document.querySelectorAll(".cancel-btn").forEach((btn) =>
    btn.addEventListener("click", () => cancelBooking(btn.dataset.id))
  );
}

/* ===============================
   LOGOUT
   =============================== */
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    const { signOut } = await import(
      "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"
    );
    const auth = window.firebaseAuth;
    await signOut(auth);
    alert("Logged out.");
    window.location.href = "auth.html";
  });
}

/* ===============================
   INITIAL LOAD
   =============================== */
document.addEventListener("DOMContentLoaded", async () => {
  await loadStats();
  await loadUsers();
  await loadBookings();
});
