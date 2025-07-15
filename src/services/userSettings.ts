// src/services/userSettings.ts
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../api/firebaseConfig';

export async function setPayday(userId: string, day: number) {
  await setDoc(doc(firestore, 'users', userId, 'settings', 'payday'), { day });
}

export async function getPayday(userId: string): Promise<number | null> {
  const snap = await getDoc(doc(firestore, 'users', userId, 'settings', 'payday'));
  return snap.exists() ? snap.data().day : null;
}

export interface NotificationSettings {
  paydayReminderEnabled: boolean;
  paydayReminderDaysBefore: number;
}

export async function setNotificationSettings(
  userId: string,
  settings: NotificationSettings
) {
  await setDoc(
    doc(firestore, 'users', userId, 'settings', 'notification'),
    settings,
    { merge: true }
  );
}

export async function getNotificationSettings(
  userId: string
): Promise<NotificationSettings | null> {
  const snap = await getDoc(
    doc(firestore, 'users', userId, 'settings', 'notification')
  );
  return snap.exists() ? (snap.data() as NotificationSettings) : null;
}