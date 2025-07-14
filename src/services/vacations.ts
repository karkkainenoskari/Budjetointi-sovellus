export interface Vacation {
  id: string;
  title: string;
  startDate: any; // Timestamp
  endDate: any; // Timestamp
}

import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../api/firebaseConfig';

export async function addVacation(userId: string, info: { title: string; startDate: any; endDate: any }): Promise<void> {
  const ref = collection(firestore, 'budjetit', userId, 'vacations');
  await addDoc(ref, { ...info, createdAt: serverTimestamp() });
}

export async function getVacations(userId: string): Promise<Vacation[]> {
  const ref = collection(firestore, 'budjetit', userId, 'vacations');
  const snap = await getDocs(ref);
  const vacations: Vacation[] = [];
  snap.forEach(docSnap => {
    const d = docSnap.data();
    vacations.push({
      id: docSnap.id,
      title: d.title,
      startDate: d.startDate,
      endDate: d.endDate,
    });
  });
  return vacations;
}

export async function deleteVacation(userId: string, id: string): Promise<void> {
  const ref = doc(firestore, 'budjetit', userId, 'vacations', id);
  await deleteDoc(ref);
}