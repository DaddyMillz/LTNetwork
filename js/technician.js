/* ================================
   TECHNICIAN PAGE SCRIPT (Fixed)
================================ */

console.log("📡 Technician page loaded");

// ===== GEOLOCATION FUNCTION =====
async function detectLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const city =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.state ||
            "Unknown";
          resolve({ city, latitude, longitude });
        } catch {
          resolve(null);
        }
      },
      () => resolve(null)
    );
  });
}

// ===== FIREBASE INITIALIZATION =====
(async function () {
  const { collection, getDocs, query, where } = await import(
    "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"
  );
  const db = window.firebaseDB;

  const techList = document.getElementById("technician-list");
  const searchForm = document.getElementById("search-form");
  const searchProfession = document.getElementById("search-profession");
  const searchLocation = document.getElementById("search-location");

  let userLocation = null;

  // ===== DISTANCE CALCULATOR =====
  function calcDist(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ===== LOAD TECHNICIANS =====
  async function loadTechnicians(filterProf = "", filterLoc = "") {
    techList.innerHTML = `<p class="loading">Loading technicians...</p>`;

    try {
      const q = query(collection(db, "users"), where("role", "==", "technician"));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        techList.innerHTML = `<p>No technicians available yet.</p>`;
        return;
      }

      const results = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.profession) return;

        const profMatch = filterProf
          ? data.profession.toLowerCase().includes(filterProf.toLowerCase())
          : true;

        const locMatch = filterLoc
          ? (data.location?.city || "")
              .toLowerCase()
              .includes(filterLoc.toLowerCase())
          : true;

        if (profMatch && locMatch) {
          const techLat = data.location?.lat || null;
          const techLng = data.location?.lng || null;
          const distance = userLocation
            ? calcDist(userLocation.latitude, userLocation.longitude, techLat, techLng)
            : null;

          results.push({
            uid: data.uid || doc.id,
            name: data.name || "Unnamed Technician",
            profession: data.profession,
            city: data.location?.city || "Unknown",
            email: data.email,
            distance,
          });
        }
      });

      if (results.length === 0) {
        techList.innerHTML = `<p>No technicians found.</p>`;
        return;
      }

      techList.innerHTML = results
        .map(
          (t) => `
          <div class="technician-card fade-in">
            <h3>${t.name}</h3>
            <p><strong>Profession:</strong> ${t.profession}</p>
            <p><strong>Location:</strong> ${t.city}</p>
            ${
              t.distance
                ? `<p><strong>Distance:</strong> ${t.distance.toFixed(1)} km away</p>`
                : ""
            }
            <p><strong>Email:</strong> ${t.email}</p>
          <a href="booking.html?service=${encodeURIComponent(t.profession)}&techEmail=${encodeURIComponent(t.email)}&techUID=${encodeURIComponent(t.uid)}" class="btn-book">Book Now</a>
          </div>`
        )
        .join("");
    } catch (err) {
      console.error("❌ Error loading technicians:", err);
      techList.innerHTML = `<p>Failed to load technicians. Please try again.</p>`;
    }
  }

  // ===== INITIAL LOAD =====
  userLocation = await detectLocation();
  await loadTechnicians();

  // ===== SEARCH HANDLER =====
  if (searchForm) {
    searchForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await loadTechnicians(searchProfession.value.trim(), searchLocation.value.trim());
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
