// ------------------------------------------------------
// Firebase Inicializace + Role + Logout – FINÁLNÍ VERZE
// ------------------------------------------------------

const firebaseConfig = {
  apiKey: "AIzaSyC-jRAsCQ7dn3xT-JUxG1Jg675Sej7vp2o",
  authDomain: "kartao-97df7.firebaseapp.com",
  projectId: "kartao-97df7",
  storageBucket: "kartao-97df7.firebasestorage.app",
  messagingSenderId: "1041236043484",
  appId: "1:1041236043484:web:6b916ba41fb82aeb2bf619",
  measurementId: "G-77NDPH3TXM"
};

// Inicializace Firebase – jen pokud ještě neběží
if (!firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Globální proměnné
window.db = firebase.firestore();
window.auth = firebase.auth();
const db = window.db;
const auth = window.auth;

// ------------------------------------------------------
// AUTOMATICKÉ NAČÍTÁNÍ ROLE PŘI PŘIHLÁŠENÍ
// ------------------------------------------------------
auth.onAuthStateChanged(async (user) => {
  if (user) {
    try {
      const uid = user.uid;

      // Načtení dokumentu uživatele z Firestore
      const doc = await db.collection("users").doc(uid).get();
      const data = doc.data() || {};

      // Čteme roli z DB – influencer / firma
      const role = data.role || "influencer";

      // Uložíme pro celou stránku
      window.currentUserRole = role;

      // Uložíme i do localStorage pro ostatní stránky
      localStorage.setItem("userRole", role);

      console.log("Role načtena:", role);

    } catch (error) {
      console.error("Chyba při načítání role:", error);
      window.currentUserRole = "influencer";
      localStorage.setItem("userRole", "influencer");
    }
  } else {
    console.log("Nepřihlášen");
    window.currentUserRole = null;
    localStorage.removeItem("userRole");
  }
});

// ------------------------------------------------------
// FUNKCE PRO ODHLÁŠENÍ UŽIVATELE
// ------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
      // Odhlášení z Firebase
      await auth.signOut();

      // Vymazání lokálních dat
      localStorage.removeItem("userRole");
      window.currentUserRole = null;

      // Přesměrování po odhlášení
      window.location.href = "index.html";
    } catch (error) {
      console.error("Chyba při odhlášení:", error);
      alert("Nepodařilo se odhlásit. Zkus to znovu.");
    }
  });
});
