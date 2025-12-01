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

  console.log("✔ Firebase služby dostupné:", {
    auth: !!window.auth,
    db: !!window.db,
    storage: !!window.storage,
  });

  // 🔓 VŽDY ZAPNOUT ONLINE REŽIM FIRESTORE + DISABLE PERSISTENCE
  if (window.db) {
    // Vypnout offline persistence (může způsobovat "offline" chyby)
    window.db.settings({
      cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
      ignoreUndefinedProperties: true,
    });

    // Force enable network
    if (window.db.enableNetwork) {
      window.db.enableNetwork()
        .then(() => {
          console.log("🌐 Firestore ONLINE (globalně z firebase-init.js)");
        })
        .catch((err) => {
          console.warn("⚠️ Nepodařilo se zapnout Firestore online:", err);
        });
    }

    // Disable offline persistence pokud je zapnutá
    window.db.disableNetwork()
      .then(() => window.db.enableNetwork())
      .then(() => {
        console.log("🔄 Firestore network resetován na ONLINE");
      })
      .catch((err) => {
        console.warn("⚠️ Network reset selhal:", err);
      });
  }
}
