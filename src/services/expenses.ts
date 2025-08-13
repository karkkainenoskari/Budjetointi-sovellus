// src/services/expenses.ts

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
} from 'firebase/firestore';
import { firestore } from '../api/firebaseConfig';

// Expense‐tyyppi
export interface Expense {
  id: string;
  categoryId: string;
  amount: number;
  date: any; // Firestore Timestamp
  description: string;
}

/**
 * Lisää uuden kulun.
 */
export async function addExpense(
  userId: string,
  { categoryId, amount, date, description }: { categoryId: string; amount: number; date: any; description: string }
): Promise<void> {
  const expensesRef = collection(firestore, 'budjetit', userId, 'expenses');
  await addDoc(expensesRef, {
    categoryId,
    amount,
    date,
    description,
    createdAt: serverTimestamp(),
  });
}

/**
 * Hakee kulut tietylle käyttäjälle ajanjaksolla (startDate <= date <= endDate).
 * Palauttaa taulukon Expense‐olioita.
 */
export async function getExpensesByPeriod(
  userId: string,
  startDate: any,
  endDate: any
): Promise<Expense[]> {
  const expensesRef = collection(firestore, 'budjetit', userId, 'expenses');
  const q = query(
    expensesRef,
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc')
  );
  const snapshot = await getDocs(q);
  const expenses: Expense[] = [];
  snapshot.forEach((docSnap) => {
    expenses.push({
      id: docSnap.id,
      categoryId: docSnap.data().categoryId,
      amount: docSnap.data().amount,
      date: docSnap.data().date,
      description: docSnap.data().description,
    });
  });
  return expenses;
}

/**
 * Hakee kaikki kulut tietylle kategoriolle ajanjaksolla.
 * Tätä voi tarpeen mukaan käyttää kulut yhteenlaskemiseen kategoriaa kohden.
 */
export async function getExpensesByCategoryAndPeriod(
  userId: string,
  categoryId: string,
  startDate: any,
  endDate: any
): Promise<Expense[]> {
  const expensesRef = collection(firestore, 'budjetit', userId, 'expenses');
  const q = query(
    expensesRef,
    where('categoryId', '==', categoryId),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc')
  );
  const snapshot = await getDocs(q);
  const expenses: Expense[] = [];
  snapshot.forEach((docSnap) => {
    expenses.push({
      id: docSnap.id,
      categoryId: docSnap.data().categoryId,
      amount: docSnap.data().amount,
      date: docSnap.data().date,
      description: docSnap.data().description,
    });
  });
  return expenses;
}
export async function updateExpense(
  userId: string,
  expenseId: string,
  data: Partial<Omit<Expense, "id">>
): Promise<void> {
  const docRef = doc(firestore, "budjetit", userId, "expenses", expenseId);
  await updateDoc(docRef, data);
}

export async function deleteExpense(
  userId: string,
  expenseId: string
): Promise<void> {
  const docRef = doc(firestore, 'budjetit', userId, 'expenses', expenseId);
  await deleteDoc(docRef);
  }