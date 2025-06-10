// src/services/notifications.ts
import * as Notifications from 'expo-notifications';

export async function schedulePaymentReminder(expense: { name: string; dueDate: Date }) {
  const trigger = new Date(expense.dueDate);
  trigger.setDate(trigger.getDate() - 1);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Maksumuistutus',
      body: `${expense.name} erääntyy huomenna.`,
    },
    trigger: trigger as unknown as Notifications.NotificationTriggerInput,
  });
}