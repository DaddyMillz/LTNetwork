/* ===== BOOKING FORM ===== */
document.addEventListener("DOMContentLoaded", async () => {
  const bookingForm = document.getElementById("booking-form");
  const popup = document.getElementById("success-popup");
  const closePopup = document.getElementById("close-popup");

  if (!bookingForm) return;

  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("book-name").value.trim();
    const phone = document.getElementById("book-phone").value.trim();
    const location = document.getElementById("book-location").value.trim();
    const details = document.getElementById("book-details").value.trim();
    const serviceParam =
      new URLSearchParams(window.location.search).get("service") || "General";

    if (!name || !phone || !location) {
      alert("Please fill in all required fields.");
      return;
    }

    const auth = window.firebaseAuth;
    const db = window.firebaseDB;

    if (!auth || !db) {
      alert("Firebase not initialized.");
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

      // Save booking
      await addDoc(collection(db, "bookings"), {
        uid: user.uid,
        email: user.email,
        name,
        phone,
        location,
        details,
        service: serviceParam,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      console.log("✅ Booking saved successfully!");

      // Reset form + show popup
      bookingForm.reset();
      if (popup) popup.classList.remove("hidden");
    } catch (err) {
      console.error("❌ Booking save failed:", err);
      alert("Something went wrong while saving your booking: " + err.message);
    }
  });

  if (closePopup) {
    closePopup.addEventListener("click", () => {
      popup.classList.add("hidden");
      window.location.href = "services.html";
    });
  }
});
