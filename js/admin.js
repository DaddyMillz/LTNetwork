/* =========================================
   ADMIN DASHBOARD SCRIPT - Local Technician Network
   ========================================= */
console.log("✅ Admin Dashboard Script Loaded");

/* ===== FIREBASE CHECK ===== */
if (!window.firebaseAuth || !window.firebaseDB) {
  console.error("❌ Firebase not initialized!");
}

/* ===== ADMIN AUTH GUARD ===== */
(async function adminAuthGuard() {
  if (!window.location.pathname.endsWith("admin-dashboard.html")) return;

  const { onAuthStateChanged, signOut } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js");
  const auth = window.firebaseAuth;
  const db = window.firebaseDB;

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Please log in as admin to continue.");
      window.location.href = "auth.html";
      return;
    }

    // Define your admin list here
    const adminEmails = ["admin@localtech.com", "superadmin@gmail.com"];
    if (!adminEmails.includes(user.email)) {
      alert("Access denied. Admins only.");
      await signOut(auth);
      window.location.href = "auth.html";
      return;
    }

    document.getElementById("admin-name").textContent =
      user.email.split("@")[0].replace(/\b\w/g, (c) => c.toUpperCase());
    console.log("👑 Admin logged in:", user.email);

    // Load dashboard data
    await loadAdminOverview(db);
    await loadUsers(db);
    await loadBookings(db);
  });

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      alert("You have been logged out.");
      window.location.href = "auth.html";
    });
  }
})();

/* ===== LOAD DASHBOARD DATA ===== */
async function loadAdminOverview(db) {
  const { getDocs, collection, query, where } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");

  const usersSnap = await getDocs(collection(db, "users"));
  const bookingsSnap = await getDocs(collection(db, "bookings"));

  const totalUsers = usersSnap.size;
  const totalTechs = usersSnap.docs.filter((d) => d.data().role === "technician").length;
  const totalBookings = bookingsSnap.size;
  const pendingBookings = bookingsSnap.docs.filter((d) => d.data().status === "pending").length;

  document.getElementById("total-users").textContent = totalUsers;
  document.getElementById("total-technicians").textContent = totalTechs;
  document.getElementById("total-bookings").textContent = totalBookings;
  document.getElementById("pending-bookings").textContent = pendingBookings;
}

/* ===== LOAD USERS ===== */
async function loadUsers(db) {
  const { getDocs, collection } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");
  const usersSnap = await getDocs(collection(db, "users"));
  const usersList = document.getElementById("users-list");
  usersList.innerHTML = "";

  usersSnap.forEach((doc) => {
    const u = doc.data();
    usersList.innerHTML += `
      <tr>
        <td>${u.name || "N/A"}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${u.profession || "-"}</td>
        <td>${u.location?.city || "Unknown"}</td>
        <td><button class="delete-btn" data-id="${doc.id}">Delete</button></td>
      </tr>`;
  });

  document.querySelectorAll(".delete-btn").forEach((btn) =>
    btn.addEventListener("click", () => deleteUser(db, btn.dataset.id))
  );
}

/* ===== LOAD BOOKINGS ===== */
async function loadBookings(db) {
  const { getDocs, collection, updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");
  const bookingsSnap = await getDocs(collection(db, "bookings"));
  const bookingsList = document.getElementById("bookings-list");
  bookingsList.innerHTML = "";

  bookingsSnap.forEach((docItem) => {
    const b = docItem.data();
    bookingsList.innerHTML += `
      <tr>
        <td>${b.service}</td>
        <td>${b.email}</td>
        <td>${b.location}</td>
        <td>${b.status}</td>
        <td>
          <select data-id="${docItem.id}" class="status-select">
            <option value="pending" ${b.status === "pending" ? "selected" : ""}>Pending</option>
            <option value="in-progress" ${b.status === "in-progress" ? "selected" : ""}>In Progress</option>
            <option value="completed" ${b.status === "completed" ? "selected" : ""}>Completed</option>
          </select>
        </td>
      </tr>`;
  });

  document.querySelectorAll(".status-select").forEach((sel) =>
    sel.addEventListener("change", async (e) => {
      const bookingId = e.target.dataset.id;
      const newStatus = e.target.value;
      await updateDoc(doc(db, "bookings", bookingId), { status: newStatus });
      alert("Booking status updated!");
    })
  );
}

/* ===== DELETE USER ===== */
async function deleteUser(db, userId) {
  if (!confirm("Are you sure you want to delete this user?")) return;
  const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");
  await deleteDoc(doc(db, "users", userId));
  alert("User deleted successfully!");
  location.reload();
}
