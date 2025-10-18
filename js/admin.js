/* ===============================
   ADMIN DASHBOARD SCRIPT
   =============================== */
import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

/* ===== DOM ELEMENTS ===== */
const adminNameEl = document.getElementById("admin-name");
const logoutBtn = document.getElementById("logout-btn");
const totalUsersEl = document.getElementById("total-users");
const totalTechsEl = document.getElementById("total-technicians");
const totalBookingsEl = document.getElementById("total-bookings");
const pendingBookingsEl = document.getElementById("pending-bookings");
const usersListEl = document.getElementById("users-list");
const bookingsListEl = document.getElementById("bookings-list");

/* ===============================
   AUTHENTICATION & ACCESS CONTROL
   =============================== */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Access denied. Please log in as an admin.");
    window.location.href = "auth.html";
    return;
  }

  const usersRef = collection(db, "users");
  const q = query(usersRef, where("uid", "==", user.uid));
  const snapshot = await getDocs(q);

  if (snapshot.empty || snapshot.docs[0].data().role !== "admin") {
    alert("Access restricted. Admins only.");
    window.location.href = "dashboard.html";
    return;
  }

  const adminData = snapshot.docs[0].data();
  adminNameEl.textContent = adminData.name || "Admin";
  console.log("👑 Admin logged in:", adminData.email);

  // Load dashboard data
  loadOverviewStats();
  loadUsers();
  loadBookings();
});

/* ===============================
   LOGOUT FUNCTIONALITY
   =============================== */
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    alert("Logged out successfully.");
    window.location.href = "auth.html";
  });
}

/* ===============================
   LOAD OVERVIEW STATISTICS
   =============================== */
async function loadOverviewStats() {
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const bookingsSnap = await getDocs(collection(db, "bookings"));

    const totalUsers = usersSnap.size;
    const totalTechs = usersSnap.docs.filter(
      (doc) => doc.data().role === "technician"
    ).length;
    const totalBookings = bookingsSnap.size;
    const pendingBookings = bookingsSnap.docs.filter(
      (doc) => doc.data().status === "pending"
    ).length;

    totalUsersEl.textContent = totalUsers;
    totalTechsEl.textContent = totalTechs;
    totalBookingsEl.textContent = totalBookings;
    pendingBookingsEl.textContent = pendingBookings;
  } catch (err) {
    console.error("❌ Failed to load overview stats:", err);
  }
}

/* ===============================
   LOAD USERS TABLE
   =============================== */
async function loadUsers() {
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    usersListEl.innerHTML = "";

    usersSnap.forEach((docSnap) => {
      const user = docSnap.data();
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${user.name || "N/A"}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td>${user.profession || "-"}</td>
        <td>${user.location?.city || "Unknown"}</td>
        <td>
          <button class="btn-action promote" data-id="${docSnap.id}" data-role="${user.role}">Toggle Role</button>
          <button class="btn-action delete" data-id="${docSnap.id}">Delete</button>
        </td>
      `;

      usersListEl.appendChild(row);
    });

    // Event listeners
    document.querySelectorAll(".promote").forEach((btn) =>
      btn.addEventListener("click", () =>
        toggleRole(btn.dataset.id, btn.dataset.role)
      )
    );
    document.querySelectorAll(".delete").forEach((btn) =>
      btn.addEventListener("click", () => deleteUser(btn.dataset.id))
    );
  } catch (err) {
    console.error("❌ Failed to load users:", err);
  }
}

/* ===== TOGGLE USER ROLE ===== */
async function toggleRole(userId, currentRole) {
  const newRole =
    currentRole === "user"
      ? "technician"
      : currentRole === "technician"
      ? "admin"
      : "user";

  if (!confirm(`Change role to "${newRole}"?`)) return;

  try {
    await updateDoc(doc(db, "users", userId), { role: newRole });
    alert(`Role updated to ${newRole}`);
    loadUsers();
    loadOverviewStats();
  } catch (err) {
    console.error("❌ Failed to update role:", err);
  }
}

/* ===== DELETE USER ===== */
async function deleteUser(userId) {
  if (!confirm("Are you sure you want to delete this user?")) return;

  try {
    await deleteDoc(doc(db, "users", userId));
    alert("User deleted successfully");
    loadUsers();
    loadOverviewStats();
  } catch (err) {
    console.error("❌ Failed to delete user:", err);
  }
}

/* ===============================
   LOAD BOOKINGS TABLE
   =============================== */
async function loadBookings() {
  try {
    const bookingsSnap = await getDocs(collection(db, "bookings"));
    bookingsListEl.innerHTML = "";

    bookingsSnap.forEach((docSnap) => {
      const b = docSnap.data();
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${b.service}</td>
        <td>${b.email}</td>
        <td>${b.location || "Unknown"}</td>
        <td>${b.status}</td>
        <td>
          <button class="btn-action approve" data-id="${docSnap.id}" data-status="${b.status}">Approve</button>
          <button class="btn-action delete-booking" data-id="${docSnap.id}">Delete</button>
        </td>
      `;

      bookingsListEl.appendChild(row);
    });

    // Event listeners
    document.querySelectorAll(".approve").forEach((btn) =>
      btn.addEventListener("click", () =>
        updateBookingStatus(btn.dataset.id, btn.dataset.status)
      )
    );
    document.querySelectorAll(".delete-booking").forEach((btn) =>
      btn.addEventListener("click", () => deleteBooking(btn.dataset.id))
    );
  } catch (err) {
    console.error("❌ Failed to load bookings:", err);
  }
}

/* ===== UPDATE BOOKING STATUS ===== */
async function updateBookingStatus(bookingId, currentStatus) {
  const newStatus = currentStatus === "pending" ? "approved" : "completed";

  if (!confirm(`Change booking status to "${newStatus}"?`)) return;

  try {
    await updateDoc(doc(db, "bookings", bookingId), { status: newStatus });
    alert(`Booking marked as ${newStatus}`);
    loadBookings();
    loadOverviewStats();
  } catch (err) {
    console.error("❌ Failed to update booking status:", err);
  }
}

/* ===== DELETE BOOKING ===== */
async function deleteBooking(bookingId) {
  if (!confirm("Delete this booking?")) return;

  try {
    await deleteDoc(doc(db, "bookings", bookingId));
    alert("Booking deleted successfully");
    loadBookings();
    loadOverviewStats();
  } catch (err) {
    console.error("❌ Failed to delete booking:", err);
  }
}
