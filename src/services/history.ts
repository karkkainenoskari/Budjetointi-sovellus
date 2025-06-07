// src/services/history.ts

import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from '../api/firebaseConfig';
import { getCurrentBudgetPeriod } from './budget';
import { Category } from './categories';

/**
 * Kopioi edellisen kuukauden kategoriat history-kokoelmaan,
 * ja aseta ne myös currentBudget/categories‐kokoelmaan.
 */
export async function copyPreviousMonthCategories(
  userId: string
): Promise<void> {
  // 1) Määritä edellinen kuukausi periodId‐muotoisena (YYYY-MM)
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const prevPeriodId = `${year}-${month}`; // '2023-05'

  // 2) Haetaan edelliseltä kuulta kategoriamallit (jos tallennettu)
  const sourceCategoriesRef = collection(
    firestore,
    'budjetit',
    userId,
    'history',
    prevPeriodId,
    'categories'
  );
  const sourceSnapshot = await getDocs(sourceCategoriesRef);
  if (sourceSnapshot.empty) {
    console.log('Ei edellisen kuukauden dataa kopioitavaksi');
    return;
  }

  // 3) Haetaan nykyisen jakson periodId (samalla metodilla kuin setCurrentBudgetPeriod luo uuden)
  const currBudget = await getCurrentBudgetPeriod(userId);
  if (!currBudget) return;
  // Oletetaan, että haet nyt “tämän hetkisen” periodId‐arvon, esim. `${vuosi}-${kuukausi}`
  const currYear = currBudget.startDate.toDate().getFullYear();
  const currMonthNum = currBudget.startDate.toDate().getMonth() + 1;
  const currMonth = currMonthNum.toString().padStart(2, '0');
  const currPeriodId = `${currYear}-${currMonth}`;

  // 4) Luo history‐ja currentBudget/categories ‐kokoelmat
  for (const catDoc of sourceSnapshot.docs) {
    const data = catDoc.data();
    // 4a) Tallenna historyyn (jos et ole jo tallentanut)
    const historyCategoriesRef = collection(
      firestore,
      'budjetit',
      userId,
      'history',
      prevPeriodId,
      'categories'
    );
    await addDoc(historyCategoriesRef, {
      title: data.title,
      allocated: data.allocated,
      parentId: data.parentId,
      type: data.type,
      createdAt: data.createdAt || serverTimestamp(),
    });

    // 4b) Kopioi sama nykyiseen periodiin
    const currentCategoriesRef = collection(
      firestore,
      'budjetit',
      userId,
      'categories'
    );
    await addDoc(currentCategoriesRef, {
      title: data.title,
      allocated: data.allocated,
      parentId: data.parentId,
      type: data.type,
      createdAt: serverTimestamp(),
    });
  }
}

/**
 * Palauta tallennettujen budjettikuukausien id:t (YYYY-MM).
 */
export async function getHistoryMonths(userId: string): Promise<string[]> {
  const historyRef = collection(firestore, 'budjetit', userId, 'history');
  const snapshot = await getDocs(historyRef);
  const months: string[] = [];
  snapshot.forEach((docSnap) => months.push(docSnap.id));
  return months;
}

/**
 * Hae tietyn kuukauden kategoriat history-kokoelmasta.
 */
export async function getHistoryCategories(
  userId: string,
  periodId: string
): Promise<Category[]> {
  const catsRef = collection(
    firestore,
    'budjetit',
    userId,
    'history',
    periodId,
    'categories'
  );
  const snapshot = await getDocs(catsRef);
  const categories: Category[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    categories.push({
      id: docSnap.id,
      title: data.title,
      allocated: data.allocated,
      parentId: data.parentId || null,
      type: data.type,
      createdAt: data.createdAt,
    });
  });
  return categories;
}