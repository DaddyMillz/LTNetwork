/* ===== TECHNICIAN PAGE SCRIPT ===== */
console.log("📡 Technician page loaded");

// ===== GEOLOCATION FUNCTION =====
async function detectLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn("❌ Geolocation not supported.");
      return resolve(null);
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        console.log("📍 User Coordinates:", latitude, longitude);

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
        } catch (err) {
          console.warn("⚠️ Reverse geocoding failed:", err);
          resolve(null);
        }
      },
      (err) => {
        console.warn("⚠️ Location access denied:", err.message);
        resolve(null);
      }
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
  const sortBtn = document.getElementById("sort-nearby");

  let userLocation = null;

  // ===== DISTANCE CALCULATOR =====
  function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371; // km
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
  async function loadTechnicians(filterProfession = "", filterLocation = "", sortByNearest = false) {
    if (!techList) return;
    techList.innerHTML = `<p class="loading">Loading technicians...</p>`;

    try {
      const q = query(collection(db, "users"), where("role", "==", "technician"));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        techList.innerHTML = `<p class="no-results">No technicians available yet.</p>`;
        return;
      }

      let results = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.profession) return;

        const professionMatch = filterProfession
          ? data.profession.toLowerCase().includes(filterProfession.toLowerCase())
          : true;

        const locationMatch = filterLocation
          ? (data.location?.city || "").toLowerCase().includes(filterLocation.toLowerCase())
          : true;

        if (professionMatch && locationMatch) {
          const techLat = data.location?.lat || null;
          const techLng = data.location?.lng || null;
          const distance = userLocation
            ? calculateDistance(userLocation.latitude, userLocation.longitude, techLat, techLng)
            : null;

          results.push({
            name: data.name || "Unnamed Technician",
            profession: data.profession,
            city: data.location?.city || "Unknown",
            email: data.email,
            distance: distance,
          });
        }
      });

      if (results.length === 0) {
        techList.innerHTML = `<p class="no-results">No technicians found for your search.</p>`;
        return;
      }

      // Sort by nearest distance if requested
      if (sortByNearest && userLocation) {
        results = results.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      }

      techList.innerHTML = results
        .map(
          (tech) => `
          <div class="tech-card fade-in">
            <h3>${tech.name}</h3>
            <p><strong>Profession:</strong> ${tech.profession}</p>
            <p><strong>Location:</strong> ${tech.city}</p>
            ${
              tech.distance
                ? `<p><strong>Distance:</strong> ${tech.distance.toFixed(1)} km away</p>`
                : ""
            }
            <p><strong>Contact:</strong> ${tech.email}</p>
            <a href="booking.html?service=${encodeURIComponent(
              tech.profession
            )}" class="btn-book">Book Now</a>
          </div>`
        )
        .join("");

      console.log(`✅ Loaded ${results.length} technicians`);
    } catch (err) {
      console.error("❌ Error loading technicians:", err);
      techList.innerHTML = `<p class="error">Failed to load technicians. Please try again later.</p>`;
    }
  }

  // ===== INITIAL LOAD =====
  userLocation = await detectLocation();
  await loadTechnicians();

  // ===== SEARCH HANDLER =====
  if (searchForm) {
    searchForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const profession = searchProfession.value.trim();
      const location = searchLocation.value.trim();
      await loadTechnicians(profession, location);
    });
  }

  // ===== SORT BY NEAREST BUTTON =====
  if (sortBtn) {
    sortBtn.addEventListener("click", async () => {
      if (!userLocation) {
        userLocation = await detectLocation();
      }
      await loadTechnicians("", "", true);
    });
  }

  // ===== MOBILE MENU TOGGLE =====
  const menuToggle = document.getElementById("menu-toggle");
  const navbar = document.getElementById("navbar");
  if (menuToggle && navbar) {
    menuToggle.addEventListener("click", () => {
      navbar.classList.toggle("active");
    });
  }
})();
