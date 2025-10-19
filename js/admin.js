/* ===== ADMIN DASHBOARD SCRIPT ===== */
(async function adminDashboard() {
  if (!window.firebaseAuth || !window.firebaseDB) return;

  const auth = window.firebaseAuth;
  const db = window.firebaseDB;

  const {
    onAuthStateChanged,
    signOut,
  } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js");
  const {
    collection,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
  } = await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js");

  const adminName = document.getElementById("admin-name");
  const usersList = document.getElementById("users-list");
  const bookingsList = document.getElementById("bookings-list");

  // Overview counters
  const totalUsersEl = document.getElementById("total-users");
  const totalTechsEl = document.getElementById("total-technicians");
  const totalBookingsEl = document.getElementById("total-bookings");
  const pendingBookingsEl = document.getElementById("pending-bookings");

  // ===== Protect admin route =====
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "auth.html";
      return;
    }

    // Check if user is admin
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("uid", "==", user.uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty || snapshot.docs[0].data().role !== "admin") {
      alert("Access denied. Admins only.");
      window.location.href = "dashboard.html";
      return;
    }

    const adminData = snapshot.docs[0].data();
    adminName.textContent = adminData.name || "Admin";

    loadDashboardData();
  });

  // ===== Load all dashboard data =====
  async function loadDashboardData() {
    await loadUsers();
    await loadBookings();
  }

  // ===== LOAD USERS + TECHNICIANS =====
  async function loadUsers() {
    const snapshot = await getDocs(collection(db, "users"));
    let usersHTML = "";

    let userCount = 0;
    let techCount = 0;

    snapshot.forEach((docSnap) => {
      const u = docSnap.data();
      if (u.role === "technician") techCount++;
      else if (u.role === "user") userCount++;

      usersHTML += `
        <tr>
          <td>${u.name || "N/A"}</td>
          <td>${u.email}</td>
          <td>${u.role}</td>
          <td>${u.profession || "-"}</td>
          <td>${u.location?.city || "Unknown"}</td>
          <td>
            <button class="delete-btn" data-id="${docSnap.id}" data-type="user">🗑️ Delete</button>
          </td>
        </tr>
      `;
    });

    totalUsersEl.textContent = userCount;
    totalTechsEl.textContent = techCount;
    usersList.innerHTML = usersHTML || "<tr><td colspan='6'>No users found.</td></tr>";

    // Bind delete buttons
    document.querySelectorAll('.delete-btn[data-type="user"]').forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (confirm("Are you sure you want to delete this user?")) {
          await deleteDoc(doc(db, "users", id));
          alert("User deleted.");
          loadUsers();
        }
      });
    });
  }

  // ===== LOAD BOOKINGS =====
  async function loadBookings() {
    const snapshot = await getDocs(collection(db, "bookings"));
    let bookingsHTML = "";

    let totalCount = 0;
    let pendingCount = 0;

    snapshot.forEach((docSnap) => {
      const b = docSnap.data();
      totalCount++;
      if (b.status === "pending") pendingCount++;

      bookingsHTML += `
        <tr>
          <td>${b.service}</td>
          <td>${b.email}</td>
          <td>${b.location}</td>
          <td>${b.status}</td>
          <td>
            <select class="status-select" data-id="${docSnap.id}">
              <option value="pending" ${b.status === "pending" ? "selected" : ""}>Pending</option>
              <option value="in-progress" ${b.status === "in-progress" ? "selected" : ""}>In Progress</option>
              <option value="completed" ${b.status === "completed" ? "selected" : ""}>Completed</option>
            </select>
            <button class="delete-btn" data-id="${docSnap.id}" data-type="booking">🗑️</button>
          </td>
        </tr>
      `;
    });

    totalBookingsEl.textContent = totalCount;
    pendingBookingsEl.textContent = pendingCount;
    bookingsList.innerHTML = bookingsHTML || "<tr><td colspan='5'>No bookings found.</td></tr>";

    // Status change
    document.querySelectorAll(".status-select").forEach((select) => {
      select.addEventListener("change", async () => {
        const id = select.dataset.id;
        const newStatus = select.value;
        await updateDoc(doc(db, "bookings", id), { status: newStatus });
        alert("Booking status updated.");
        loadBookings();
      });
    });

    // Delete booking
    document.querySelectorAll('.delete-btn[data-type="booking"]').forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (confirm("Are you sure you want to delete this booking?")) {
          await deleteDoc(doc(db, "bookings", id));
          alert("Booking deleted.");
          loadBookings();
        }
      });
    });
  }

  // ===== LOGOUT =====
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      alert("You have been logged out.");
      window.location.href = "auth.html";
    });
  }

  // ===== NAVBAR TOGGLE =====
  const menuToggle = document.getElementById("menu-toggle");
  const navbar = document.getElementById("navbar");
  if (menuToggle && navbar) {
    menuToggle.addEventListener("click", () => {
      navbar.classList.toggle("active");
    });
  }
})();
