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
