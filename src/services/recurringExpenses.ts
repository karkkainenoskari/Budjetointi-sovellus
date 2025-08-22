import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  where,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from '../api/firebaseConfig';

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  dueDate: any; 
  recurrence: 'weekly' | 'monthly';
  active: boolean;
  createdAt: any;
}

export async function addRecurringExpense(
  userId: string,
  { name, amount, categoryId, dueDate, recurrence }: Omit<RecurringExpense, 'id' | 'active' | 'createdAt'>
) {
  const colRef = collection(firestore, 'budjetit', userId, 'recurringExpenses');
  await addDoc(colRef, {
    name,
    amount,
    categoryId,
    dueDate,
    recurrence,
    active: true,
    createdAt: serverTimestamp(),
  });
}

export async function getActiveRecurringExpenses(userId: string): Promise<RecurringExpense[]> {
  const colRef = collection(firestore, 'budjetit', userId, 'recurringExpenses');
  const q = query(colRef, where('active', '==', true));
  const snapshot = await getDocs(q);
  const results: RecurringExpense[] = [];
  snapshot.forEach((docSnap) =>
    results.push({ id: docSnap.id, ...(docSnap.data() as Omit<RecurringExpense, 'id'>) })
  );
  return results;
}

export async function updateRecurringExpense(
  userId: string,
  id: string,
  data: Partial<Omit<RecurringExpense, 'id' | 'createdAt'>>
) {
  const ref = doc(firestore, 'budjetit', userId, 'recurringExpenses', id);
  await updateDoc(ref, data);
}

export async function deleteRecurringExpense(userId: string, id: string) {
  const ref = doc(firestore, 'budjetit', userId, 'recurringExpenses', id);
  await deleteDoc(ref);
}