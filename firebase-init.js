const firebaseConfig = {
  apiKey: "AIzaSyC-jRAsCQ7dn3xT-JUxG1Jg675Sej7vp2o",
  authDomain: "kartao-97df7.firebaseapp.com",
  projectId: "kartao-97df7",
  storageBucket: "kartao-97df7.firebasestorage.app",
  messagingSenderId: "1041236043484",
  appId: "1:1041236043484:web:6b916ba41fb82aeb2bf619",
  measurementId: "G-77NDPH3TXM"
};


// Inicializace Firebase
if (!firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Globální proměnné
window.db = firebase.firestore();
window.auth = firebase.auth();
const db = window.db;
const auth = window.auth;
// AUTOMATICKÉ NAČÍTÁNÍ ROLE PŘI PŘIHLÁŠENÍ
auth.onAuthStateChanged(async (user) => {
  if (user) {
    try {
      const uid = user.uid;

      // Načtení dokumentu uživatele z Firestore
      const doc = await db.collection("user").doc(uid).get();
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
    // Uživatel není přihlášený
    console.log("Nepřihlášen");

    window.currentUserRole = "influencer";
    localStorage.removeItem("userRole");
  }
});
