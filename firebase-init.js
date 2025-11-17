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

// Inicializace Firebase (pouze jednou)
if (!firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized');
} else {
  console.log('ℹ️ Firebase already initialized');
}

// Firestore instance - globální přístup (pouze pokud ještě není)
if (!window.db) {
  window.db = firebase.firestore();
  console.log('✅ Firestore DB created');
}

if (!window.auth) {
  window.auth = firebase.auth();
  console.log('✅ Firebase Auth created');
}

// Backwards compatibility
const db = window.db;
const auth = window.auth;

// Auth status
let AOcurrentUser = null;

firebase.auth().onAuthStateChanged((user) => {
  AOcurrentUser = user || null;
  console.log('🔐 Auth state changed:', user ? user.email : 'Not logged in');
});
