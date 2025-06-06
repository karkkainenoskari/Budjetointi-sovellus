// src/services/budget.ts

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from '../api/firebaseConfig';

export interface BudgetPeriod {
  startDate: any; // Timestamp
  endDate: any;   // Timestamp
  totalAmount: number;
  createdAt: any;
}

/**
 * Aseta tai päivitä käyttäjän nykyinen budjettijakso.
 * Tämä kirjoittaa dokumenttiin: budjetit/{userId}/currentBudget
 */
export async function setCurrentBudgetPeriod(
  userId: string,
  {
    startDate,
    endDate,
    totalAmount,
  }: { startDate: any; endDate: any; totalAmount: number }
): Promise<void> {
  if (!userId) return;
  const budgetDocRef = doc(firestore, 'budjetit', userId, 'currentBudget', 'settings');
  await setDoc(budgetDocRef, {
    startDate,
    endDate,
    totalAmount,
    createdAt: serverTimestamp(),
  });
}

/**
 * Hae nykyinen budjettijakso (tai palauta null, jos ei ole)
 */
export async function getCurrentBudgetPeriod(
  userId: string
): Promise<BudgetPeriod | null> {
  if (!userId) return null;
  const budgetDocRef = doc(firestore, 'budjetit', userId, 'currentBudget', 'settings');
  const snap = await getDoc(budgetDocRef);
  if (!snap.exists()) {
    return null;
  }
  return {
    startDate: snap.data().startDate,
    endDate: snap.data().endDate,
    totalAmount: snap.data().totalAmount,
    createdAt: snap.data().createdAt,
  };
}
