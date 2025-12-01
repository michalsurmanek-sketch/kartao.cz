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
  
  // Firestore s nastavením PŘED prvním použitím
  const db = firebase.firestore();
  
  // Settings musí být voláno PŘED jakýmkoliv read/write
  try {
    db.settings({
      ignoreUndefinedProperties: true,
    });
    console.log("⚙️ Firestore settings OK");
  } catch (err) {
    console.warn("⚠️ Settings už nastaveny:", err.message);
  }
  
  window.db = db;
  window.storage = firebase.storage ? firebase.storage() : null;

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

