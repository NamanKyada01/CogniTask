import notifee, {TimestampTrigger, TriggerType, RepeatFrequency} from '@notifee/react-native';

export const NotificationService = {
  async setupWeeklyRecap() {
    await notifee.requestPermission();

    const channelId = await notifee.createChannel({
      id: 'recap',
      name: 'Weekly Recap',
    });

    // Calculate next Sunday at 20:00
    const now = new Date();
    const nextSunday = new Date();
    nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7));
    if (now.getDay() === 0 && now.getHours() >= 20) {
      // If it's already past 20:00 on Sunday, schedule for next week
      nextSunday.setDate(nextSunday.getDate() + 7);
    }
    nextSunday.setHours(20, 0, 0, 0);

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: nextSunday.getTime(),
      repeatFrequency: RepeatFrequency.WEEKLY,
    };

    await notifee.createTriggerNotification(
      {
        id: 'weekly_recap',
        title: 'Weekly Smart Recap 🎉',
        body: 'Your weekly performance insights and AI tips are ready!',
        android: {
          channelId,
          pressAction: {
            id: 'default',
          },
        },
      },
      trigger,
    );
  },
};
