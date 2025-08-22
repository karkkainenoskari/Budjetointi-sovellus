import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  deleteDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { firestore } from '../api/firebaseConfig';
import { getActiveRecurringExpenses } from './recurringExpenses';
import { addExpense } from './expenses';
import { getCategories } from './categories';
import { clearIncomes } from './incomes';

export interface BudgetPeriod {
  startDate: any; 
  endDate: any;   
  totalAmount: number;
  createdAt: any;
}

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

export async function createBudgetPeriod(
  userId: string,
  info: { startDate: any; endDate: any; totalAmount: number }
): Promise<void> {
  await setCurrentBudgetPeriod(userId, info);
}

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

export async function clearCurrentBudgetPeriod(userId: string): Promise<void> {
  if (!userId) return;
  const budgetDocRef = doc(firestore, 'budjetit', userId, 'currentBudget', 'settings');
  await deleteDoc(budgetDocRef);
}

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

export async function archiveCurrentCategories(
  userId: string,
  periodId: string
): Promise<void> {
  if (!userId) return;
  const categories = await getCategories(userId);
  for (const cat of categories) {
    const histRef = doc(
      firestore,
      'budjetit',
      userId,
      'history',
      periodId,
      'categories',
      cat.id
    );
    await setDoc(histRef, {
      title: cat.title,
      allocated: cat.allocated,
      parentId: cat.parentId,
      type: cat.type,
      createdAt: cat.createdAt || serverTimestamp(),
    });

    const catRef = doc(firestore, 'budjetit', userId, 'categories', cat.id);
    await updateDoc(catRef, { allocated: 0 });
  }
}
export async function archiveCurrentIncomes(
  userId: string,
  periodId: string
): Promise<void> {
  if (!userId) return;
  const incomesRef = collection(firestore, 'budjetit', userId, 'incomes');
  const snap = await getDocs(incomesRef);
  for (const inc of snap.docs) {
    const data = inc.data();
    const histRef = doc(
      firestore,
      'budjetit',
      userId,
      'history',
      periodId,
      'incomes',
      inc.id
    );
    await setDoc(histRef, {
      title: data.title,
      amount: data.amount,
      createdAt: data.createdAt || serverTimestamp(),
    });
  }
}

export async function startNewBudgetPeriod(
  userId: string,
  periodInfo: { startDate: any; endDate: any; totalAmount: number }
): Promise<void> {
  const current = await getCurrentBudgetPeriod(userId);
  if (current) {
    const d = current.startDate.toDate();
    const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    await saveBudgetPeriodToHistory(userId, id, {
      startDate: current.startDate,
      endDate: current.endDate,
      totalAmount: current.totalAmount,
    });
    await archiveCurrentCategories(userId, id);
    await archiveCurrentIncomes(userId, id);
  }
  await setCurrentBudgetPeriod(userId, periodInfo);
  await clearIncomes(userId);


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

export async function deleteBudgetPeriod(
  userId: string,
  periodId: string
): Promise<void> {
  if (!userId) return;

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

  const periodRef = doc(firestore, 'budjetit', userId, 'history', periodId);
  await deleteDoc(periodRef);
}