// ==========================================
// Firebase INIT – Kartao.cz (sjednocená verze)
// ==========================================

// Ochrana proti vícenásobné inicializaci
if (typeof firebase !== "undefined") {
  
  // Pokud Firebase ještě není inicializované → použij konfiguraci z firebase-config.js
  if (!firebase.apps || !firebase.apps.length) {
    if (typeof firebaseConfig === "undefined") {
      console.error("❌ firebase-config.js nebyl načten. Ujisti se, že je nad firebase-init.js.");
    } else {
      firebase.initializeApp(firebaseConfig);
      console.log("🔥 Firebase inicializováno přes firebase-init.js");
    }
  }

  // Zajisti globální proměnné (aby byly na každé stránce)
  window.auth    = firebase.auth();
  window.db      = firebase.firestore();
  window.storage = firebase.storage ? firebase.storage() : null;

  console.log("✔ Firebase služby dostupné:", {
    auth: !!window.auth,
    db: !!window.db,
    storage: !!window.storage
  });

} else {
  console.error("❌ Firebase SDK není načteno. Chybí <script src='firebase-app-compat.js'> atd.");
}
