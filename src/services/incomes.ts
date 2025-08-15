// src/services/incomes.ts
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData,
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

export async function getIncomesByPeriod(
  userId: string,
  startDate: any,
  endDate: any
): Promise<Income[]> {
  const colRef = collection(firestore, 'budjetit', userId, 'incomes');
  const q = query(
    colRef,
    where('createdAt', '>=', startDate),
    where('createdAt', '<=', endDate),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  const results: Income[] = [];
  snap.forEach((d) =>
    results.push({ id: d.id, ...(d.data() as Omit<Income, 'id'>) })
  );
  return results;
}

export async function addIncome(
  userId: string,
  {
    title,
    amount,
    createdAt,
  }: { title: string; amount: number; createdAt?: Date }
): Promise<void> {
  const colRef = collection(firestore, 'budjetit', userId, 'incomes');
await addDoc(colRef, {
    title,
    amount,
    createdAt: createdAt ? createdAt : serverTimestamp(),
  });
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

/**
 * Poistaa kaikki tulot käyttäjältä.
 * Käytetään uuden budjettijakson alussa, jotta arvot alkavat nollasta.
 */
export async function clearIncomes(userId: string): Promise<void> {
  const colRef = collection(firestore, 'budjetit', userId, 'incomes');
  const snap = await getDocs(colRef);
  for (const d of snap.docs as QueryDocumentSnapshot<DocumentData>[]) {
    await deleteDoc(doc(firestore, 'budjetit', userId, 'incomes', d.id));
  }
}