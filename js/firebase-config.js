import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyB51I0bk9f6wU_qIDNzKtjmsrNtku5WeGA",
  authDomain: "ltnetwork.firebaseapp.com",
  projectId: "ltnetwork",
  storageBucket: "ltnetwork.firebasestorage.app",
  messagingSenderId: "790106442971",
  appId: "1:790106442971:web:23fab05cc6c0c5ef9a10fe",
  measurementId: "G-YJ7GPCMRV4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

console.log("Firebase initialized ✅", app);

// make available globally
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDB = db;

export { app, auth, db };

