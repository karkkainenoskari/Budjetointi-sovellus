import * as Notifications from 'expo-notifications';
import { getPayday, getNotificationSettings } from './userSettings';
import type { CalendarTriggerInput } from 'expo-notifications';

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

export async function registerPaydayReminder(userId: string) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const [payday, settings] = await Promise.all([
      getPayday(userId),
      getNotificationSettings(userId),
    ]);

    if (!payday || !settings || !settings.paydayReminderEnabled) return;

    const trigger: CalendarTriggerInput = {
      day:
        payday > settings.paydayReminderDaysBefore
          ? payday - settings.paydayReminderDaysBefore
          : payday,
      hour: 9,
      minute: 0,
      repeats: true,
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Palkkapäivä lähestyy',
        body: 'Muista tehdä uusi budjetti!',
      },
      trigger,
    });
  } catch (e) {
    console.error('Muistutuksen ajoittaminen epäonnistui:', e);
  }
}