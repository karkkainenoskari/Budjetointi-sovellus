// src/services/incomes.ts
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from '../api/firebaseConfig';

export interface Income {
  id: string;
  title: string;
  amount: number;
  createdAt: any;
}

export async function getIncomes(userId: string): Promise<Income[]> {
  const colRef = collection(firestore, 'budjetit', userId, 'incomes');
  const snap = await getDocs(colRef);
  const results: Income[] = [];
  snap.forEach((d) =>
    results.push({ id: d.id, ...(d.data() as Omit<Income, 'id'>) })
  );
  return results.sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);
}

export async function addIncome(
  userId: string,
  { title, amount }: { title: string; amount: number }
): Promise<void> {
  const colRef = collection(firestore, 'budjetit', userId, 'incomes');
  await addDoc(colRef, { title, amount, createdAt: serverTimestamp() });
}

export async function updateIncome(
  userId: string,
  incomeId: string,
  data: { title: string; amount: number }
): Promise<void> {
  const ref = doc(firestore, 'budjetit', userId, 'incomes', incomeId);
  await updateDoc(ref, data);
}

export async function deleteIncome(
  userId: string,
  incomeId: string
): Promise<void> {
  const ref = doc(firestore, 'budjetit', userId, 'incomes', incomeId);
  await deleteDoc(ref);
}