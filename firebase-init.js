// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAmUuqkye67hhyoauRJiUVi_UVEdzU7hTI",
  authDomain: "kartao-cz.firebaseapp.com",
  projectId: "kartao-cz",
  storageBucket: "kartao-cz.appspot.com",
  messagingSenderId: "712778602439",
  appId: "1:712778602439:web:14e2b4c07ea35f70a16be2",
  measurementId: "G-QC38M7X2KT"
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
    // Uživatel není přihlášený
    console.log("Nepřihlášen");

    window.currentUserRole = "influencer";
    localStorage.removeItem("userRole");
  }
});
