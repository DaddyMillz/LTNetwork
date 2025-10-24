/* ===============================
   BOOKING PAGE SCRIPT
   =============================== */

document.addEventListener("DOMContentLoaded", async () => {
  // ===== NAVBAR TOGGLE =====
  const menuToggle = document.getElementById("menu-toggle");
  const navbar = document.getElementById("navbar");
  if (menuToggle && navbar) {
    menuToggle.addEventListener("click", () => {
      navbar.classList.toggle("active");
    });
  }

  // ===== FIREBASE SETUP =====
  const auth = window.firebaseAuth;
  const db = window.firebaseDB;
  if (!auth || !db) {
    console.error("⚠️ Firebase not initialized properly.");
    return;
  }

  // ===== ELEMENTS =====
  const bookingForm = document.getElementById("booking-form");
  const popup = document.getElementById("success-popup");
  const closePopup = document.getElementById("close-popup");

  if (!bookingForm) return;

  // ===== GET URL PARAMS =====
  const urlParams = new URLSearchParams(window.location.search);
  const serviceParam = urlParams.get("service") || "General";
  const technicianEmail = urlParams.get("techEmail") || null;
  const technicianUID = urlParams.get("techUID") || null;

  // ===== AUTO-FILL SERVICE TITLE =====
  const serviceTitle = document.getElementById("service-title");
  if (serviceTitle && serviceParam) {
    serviceTitle.textContent = `Book ${serviceParam.charAt(0).toUpperCase() + serviceParam.slice(1)} Service`;
  }

  // ===== BOOKING HANDLER =====
  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("book-name").value.trim();
    const phone = document.getElementById("book-phone").value.trim();
    const location = document.getElementById("book-location").value.trim();
    const details = document.getElementById("book-details").value.trim();

    if (!name || !phone || !location || !details) {
      alert("Please fill all required fields.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("Please log in before booking.");
      window.location.href = "auth.html";
      return;
    }

    try {
      const { addDoc, collection, serverTimestamp } = await import(
        "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"
      );

      await addDoc(collection(db, "bookings"), {
        uid: user.uid,
        email: user.email,
        name,
        phone,
        location,
        details,
        service: serviceParam,
        technicianUID,
        technicianEmail,
        status: technicianEmail ? "pending" : "pending-assignment",
        createdAt: serverTimestamp(),
      });

      console.log("✅ Booking saved successfully!");
      bookingForm.reset();
      if (popup) popup.classList.remove("hidden");
    } catch (err) {
      console.error("❌ Booking failed:", err);
      alert("Something went wrong while saving your booking. Please try again.");
    }
  });

  // ===== CLOSE POPUP =====
  if (closePopup) {
    closePopup.addEventListener("click", () => {
      popup.classList.add("hidden");
      window.location.href = "services.html";
    });
  }
});
