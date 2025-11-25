// ==========================
// Firebase Config – Kartao.cz
// ==========================

// Tvůj Firebase projekt
const firebaseConfig = {
  apiKey: "AIzaSyC-jRAsCQ7dn3xT-JUxG1Jg675Sej7vp2o",
  authDomain: "kartao-97df7.firebaseapp.com",
  projectId: "kartao-97df7",
  storageBucket: "kartao-97df7.firebasestorage.app",
  messagingSenderId: "1041236043484",
  appId: "1:1041236043484:web:6b916ba41fb82aeb2bf619",
  measurementId: "G-77NDPH3TXM"
};

// Inicializace Firebase (bez chyb, i pokud už běží)
if (!firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Globální proměnné – jednotně pro celý web
window.auth = firebase.auth();
window.db   = firebase.firestore();
window.storage = firebase.storage ? firebase.storage() : null;

console.log("🔥 Firebase inicializováno přes firebase-config.js");
