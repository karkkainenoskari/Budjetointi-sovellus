// src/services/budget.ts

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import { firestore } from '../api/firebaseConfig';
import { getActiveRecurringExpenses } from './recurringExpenses';
import { addExpense } from './expenses';
import { copyPreviousMonthCategories } from './history';

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


/**
 * Tallenna budjettijakson tiedot history-kokoelmaan.
 */
export async function saveBudgetPeriodToHistory(
  userId: string,
  periodId: string,
  info: { startDate: any; endDate: any; totalAmount: number }
): Promise<void> {
  if (!userId) return;
   const historySettingsRef = doc(
    firestore,
    'budjetit',
    userId,
    'history',
    periodId,
  );
  await setDoc(historySettingsRef, { ...info, createdAt: serverTimestamp() });
}

/**
 * Hae budjettijakson tiedot history-kokoelmasta.
 */
export async function getBudgetPeriodFromHistory(
  userId: string,
  periodId: string
): Promise<BudgetPeriod | null> {
  if (!userId) return null;
  const docRef = doc(
    firestore,
    'budjetit',
    userId,
    'history',
    periodId,
  );
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return {
    startDate: snap.data().startDate,
    endDate: snap.data().endDate,
    totalAmount: snap.data().totalAmount,
    createdAt: snap.data().createdAt,
  };
}
/**
 * Aloita uusi budjettijakso ja kopioi mukaan toistuvat menot
 * sekä edellisen kuukauden kategoriat.
 */
export async function startNewBudgetPeriod(
  userId: string,
  periodInfo: { startDate: any; endDate: any; totalAmount: number }
): Promise<void> {
  // Tallenna mahdollinen aiempi jakso historyyn
  const current = await getCurrentBudgetPeriod(userId);
  if (current) {
    const d = current.startDate.toDate();
    const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    await saveBudgetPeriodToHistory(userId, id, {
      startDate: current.startDate,
      endDate: current.endDate,
      totalAmount: current.totalAmount,
    });
  }
  await setCurrentBudgetPeriod(userId, periodInfo);

  await copyPreviousMonthCategories(userId);

  const recurring = await getActiveRecurringExpenses(userId);
  for (const exp of recurring) {
    await addExpense(userId, {
      categoryId: exp.categoryId,
      amount: exp.amount,
      date: exp.dueDate,
      description: exp.name,
    });
  }
}

/**
 * Poista budjettijakso historiasta.
 */
export async function deleteBudgetPeriod(
  userId: string,
  periodId: string
): Promise<void> {
  if (!userId) return;

  // Poista jakson kategoriat, jos niitä on tallennettu
  const catsRef = collection(
    firestore,
    'budjetit',
    userId,
    'history',
    periodId,
    'categories'
  );
  const snap = await getDocs(catsRef);
  for (const docSnap of snap.docs) {
    await deleteDoc(doc(firestore, 'budjetit', userId, 'history', periodId, 'categories', docSnap.id));
  }

  // Poista itse jakso
  const periodRef = doc(firestore, 'budjetit', userId, 'history', periodId);
  await deleteDoc(periodRef);
}