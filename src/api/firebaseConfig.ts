// src/api/firebaseConfig.ts
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// ┌────────────────────────────────────────────────────────────────┐
// │ 1) KOPIOI TÄHÄN OMAN FIREBASE-PROJEKTISI KONFIGURAATIO        │
// │    (Projektin asetukset → General → Your apps → Web app SDK). │
// └────────────────────────────────────────────────────────────────┘
const firebaseConfig = {
  apiKey: "AIzaSyC45hnhNkZF8ASi2ZGtzN7laJwX-oQdf0k",
  authDomain: "budjetointiaplikaatio.firebaseapp.com",
  projectId: "budjetointiaplikaatio",
  storageBucket: "budjetointiaplikaatio.firebasestorage.app",
  messagingSenderId: "746160459264",
  appId: "1:746160459264:web:d1c744164444892041d2e5",
  measurementId: "G-98Y1WTLKM1"
};

// ┌───────────────────────────────────────────────────────────────────┐
// │ 2) Alustetaan Firebase‐sovellus vain kerran (hot-reload turvaksi)   │
// └───────────────────────────────────────────────────────────────────┘
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// ┌───────────────────────────────────────────────────────────────────┐
// │ 3) Exportataan “compat”-Auth ja “compat”-Firestore                │
// │    Älä käytä getAuth(app) tai initializeAuth(...) tässä vaiheessa. │
// └───────────────────────────────────────────────────────────────────┘
export const auth = firebase.auth();
export const db = firebase.firestore();