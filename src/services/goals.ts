import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from '../api/firebaseConfig';

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentSaved: number;
  deadline: any;    
  monthlyAmount: number;
  createdAt: any;    
}

export async function getGoals(userId: string): Promise<Goal[]> {
  const goalsRef = collection(firestore, 'budjetit', userId, 'goals');
  const snapshot = await getDocs(goalsRef);
  const goals: Goal[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    goals.push({
      id: docSnap.id,
      title: data.title,
      targetAmount: data.targetAmount,
      currentSaved: data.currentSaved || 0,
      deadline: data.deadline,
      monthlyAmount: data.monthlyAmount,
      createdAt: data.createdAt,
    });
  });
  return goals;
}

export async function addGoal(
  userId: string,
  {
    title,
    targetAmount,
    deadline,
  }: { title: string; targetAmount: number; deadline: any }
): Promise<void> {
  const now = new Date();
  const monthsRemaining =
    (deadline.getFullYear() - now.getFullYear()) * 12 +
    (deadline.getMonth() - now.getMonth()) +
    1;
  const monthlyAmount = targetAmount / monthsRemaining;
  const goalsRef = collection(firestore, 'budjetit', userId, 'goals');
  await addDoc(goalsRef, {
    title,
    targetAmount,
    currentSaved: 0,
    deadline,
    monthlyAmount,
    createdAt: serverTimestamp(),
  });
}

export async function updateGoal(
  userId: string,
  goalId: string,
  {
    title,
    targetAmount,
    deadline,
    currentSaved,
  }: { title: string; targetAmount: number; deadline: any; currentSaved: number }
): Promise<void> {
  const now = new Date();
  const monthsRemaining =
    (deadline.getFullYear() - now.getFullYear()) * 12 +
    (deadline.getMonth() - now.getMonth()) +
    1;
  const monthlyAmount = targetAmount / monthsRemaining;
  const goalDocRef = doc(firestore, 'budjetit', userId, 'goals', goalId);
  await updateDoc(goalDocRef, {
    title,
    targetAmount,
    deadline,
    currentSaved,
    monthlyAmount,
  });
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  const goalDocRef = doc(firestore, 'budjetit', userId, 'goals', goalId);
  await deleteDoc(goalDocRef);
}
