// ==========================================
// Firebase INIT – Kartao.cz (sjednocená verze)
// ==========================================

if (typeof firebase === "undefined") {
  console.error("❌ Firebase SDK není načteno. Chybí <script src='firebase-app-compat.js'> atd.");
} else {
  // pro jistotu – globální reference
  window.firebase = firebase;

  // Inicializace aplikace jen jednou
  if (!firebase.apps || !firebase.apps.length) {
    if (typeof firebaseConfig === "undefined") {
      console.error("❌ firebase-config.js nebyl načten. Ujisti se, že je nad firebase-init.js.");
    } else {
      firebase.initializeApp(firebaseConfig);
      console.log("🔥 Firebase inicializováno přes firebase-init.js");
    }
  }

  // Globální služby
  window.auth = firebase.auth();
  window.db = firebase.firestore();
  window.storage = firebase.storage ? firebase.storage() : null;

  console.log("✔ Firebase služby dostupné:", {
    auth: !!window.auth,
    db: !!window.db,
    storage: !!window.storage,
  });

  // 🌐 FORCE ONLINE - disable pak enable (resetuje stav)
  if (window.db) {
    window.db.disableNetwork()
      .then(() => {
        console.log("🔄 Firestore network disabled");
        return window.db.enableNetwork();
      })
      .then(() => {
        console.log("🌐 Firestore FORCE ONLINE aktivován");
      })
      .catch((err) => {
        console.error("❌ Network toggle error:", err.message);
        // Zkus jen enable
        return window.db.enableNetwork()
          .then(() => console.log("✅ enableNetwork fallback OK"))
          .catch((e) => console.error("❌ enableNetwork fallback failed:", e.message));
      });
  }
}

