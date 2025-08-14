// src/services/history.ts

import {
  collection,
  getDocs,
   setDoc,
  serverTimestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { firestore } from '../api/firebaseConfig';
import { Category } from './categories';

/**
 * Kopioi edellisen kuukauden kategoriat history-kokoelmaan,
 * ja aseta ne myös currentBudget/categories‐kokoelmaan.
 */
export async function copyPreviousMonthPlan(userId: string): Promise<void> {
  if (!userId) return;


  const currBudgetRef = doc(
    firestore,
    'budjetit',
    userId,
    'currentBudget',
    'settings'
  );
  const currSnap = await getDoc(currBudgetRef);
  if (!currSnap.exists()) return;

const currStart = currSnap.data().startDate.toDate();
  const prevDate = new Date(currStart);
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prevId = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

// Hae edellisen kuukauden kategoriat historiasta
  const prevCatsRef = collection(
    firestore,
    'budjetit',
    userId,
    'history',
    prevId,
    'categories'
  );
  const prevSnap = await getDocs(prevCatsRef);
  if (prevSnap.empty) return;

  // Päivitä tai luo kategoriat nykyiseen jaksoon
  for (const catDoc of prevSnap.docs) {
    const data = catDoc.data();
    const catRef = doc(firestore, 'budjetit', userId, 'categories', catDoc.id);
    await setDoc(
      catRef,
      {
        title: data.title,
        allocated: data.allocated,
        parentId: data.parentId ?? null,
        type: data.type,
        createdAt: data.createdAt || serverTimestamp(),
      },
      { merge: true  }
    );
  }
   // Kopioi edellisen kuukauden tulot nykyiseen jaksoon
  const prevIncomesRef = collection(
    firestore,
    'budjetit',
    userId,
    'history',
    prevId,
    'incomes'
  );
  const prevIncomesSnap = await getDocs(prevIncomesRef);
  for (const incDoc of prevIncomesSnap.docs) {
    const data = incDoc.data();
    const incRef = doc(firestore, 'budjetit', userId, 'incomes', incDoc.id);
    await setDoc(incRef, {
      title: data.title,
      amount: data.amount,
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