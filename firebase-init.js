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
  window.auth    = firebase.auth();
  window.db      = firebase.firestore();
  window.storage = firebase.storage ? firebase.storage() : null;

  // 🔓 FIRESTORE SETTINGS - MUSÍ BÝT PŘED PRVNÍM POUŽITÍM!
  if (window.db) {
    try {
      window.db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
        ignoreUndefinedProperties: true,
      });
      console.log("⚙️ Firestore settings nastaveny");
    } catch (err) {
      console.warn("⚠️ Firestore settings error (možná už běží):", err.message);
    }
  }

  console.log("✔ Firebase služby dostupné:", {
    auth: !!window.auth,
    db: !!window.db,
    storage: !!window.storage,
  });

  // 🌐 ZAPNOUT ONLINE REŽIM
  if (window.db && window.db.enableNetwork) {
    window.db.enableNetwork()
      .then(() => {
        console.log("🌐 Firestore ONLINE režim aktivován");
      })
      .catch((err) => {
        console.error("❌ enableNetwork() selhalo:", err.message);
      });
  }
}
}
