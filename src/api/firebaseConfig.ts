// src/api/firebaseConfig.ts

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

// ┌────────────────────────────────────────────────────────────────┐
// │ 2) Alustetaan Firebase-sovellus vain kerran (hot-reload turvaksi) │
// └────────────────────────────────────────────────────────────────┘
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// ┌────────────────────────────────────────────────────────────────┐
// │ 3) Haetaan JS-SDK:n Auth ja Firestore -instanssit ilman        │
// │    erillistä “react-native” -initialisointia                  │
// └────────────────────────────────────────────────────────────────┘
export const auth = getAuth(app);
export const db = getFirestore(app);
