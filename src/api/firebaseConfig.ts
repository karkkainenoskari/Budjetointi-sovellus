import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC45hnhNkZF8ASi2ZGtzN7laJwX-oQdf0k",
  authDomain: "budjetointiaplikaatio.firebaseapp.com",
  projectId: "budjetointiaplikaatio",
  storageBucket: "budjetointiaplikaatio.appspot.com",
  messagingSenderId: "746160459264",
  appId: "1:746160459264:web:d1c744164444892041d2e5",
  measurementId: "G-98Y1WTLKM1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);