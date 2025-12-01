// auth.js – Jednotné přihlášení, registrace a odhlášení pro Kartao.cz

// Inicializace Firebase Auth (předpokládá načtení firebase-init.js)
const auth = window.auth || (window.firebase && firebase.auth && firebase.auth());
const db   = window.db   || (window.firebase && firebase.firestore && firebase.firestore());

if (!auth || !db) {
  console.error("Auth nebo DB nejsou dostupné – zkontroluj firebase-config.js a firebase-init.js");
}

// Přihlášení e-mailem a heslem
async function loginWithEmail(email, password) {
  return auth.signInWithEmailAndPassword(email, password);
}

// Registrace e-mailem a heslem
async function registerWithEmail(email, password, role = "influencer") {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  await db.collection("users").doc(cred.user.uid).set({
    email: cred.user.email || email,
    role: role,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  return cred;
}

// Přihlášení přes Google
async function loginWithGoogle(role = "influencer") {
  const provider = new firebase.auth.GoogleAuthProvider();
  const result = await auth.signInWithPopup(provider);
  await db.collection("users").doc(result.user.uid).set({
    email: result.user.email || null,
    role: role,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  return result;
}

// Odhlášení
async function logout() {
  await auth.signOut();
}

// Získání aktuálního uživatele (asynchronně)
function onAuthStateChanged(callback) {
  return auth.onAuthStateChanged(callback);
}

window.kartaoAuth = {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  logout,
  onAuthStateChanged,
};
