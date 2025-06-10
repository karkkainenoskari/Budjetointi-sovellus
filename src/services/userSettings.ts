// src/services/userSettings.ts
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../api/firebaseConfig';

export async function setPayday(userId: string, day: number) {
  await setDoc(doc(firestore, 'users', userId, 'settings', 'payday'), { day });
}

export async function getPayday(userId: string): Promise<number | null> {
  const snap = await getDoc(doc(firestore, 'users', userId, 'settings', 'payday'));
  return snap.exists() ? snap.data().day : null;
}