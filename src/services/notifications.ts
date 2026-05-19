export function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return Promise.resolve(false);
  if (Notification.permission === 'granted') return Promise.resolve(true);
  if (Notification.permission === 'denied') return Promise.resolve(false);
  return Notification.requestPermission().then(p => p === 'granted');
}

export function showNotification(title: string, options?: NotificationOptions): void {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon-192.png',
      ...options,
    });
  }
}

export function schedulePrayerNotification(prayerName: string, time: string): void {
  const now = new Date();
  const [h, m] = time.split(':').map(Number);
  const prayerTime = new Date(now);
  prayerTime.setHours(h, m, 0, 0);

  let diff = prayerTime.getTime() - now.getTime();
  if (diff < 0) diff += 86400000;

  setTimeout(() => {
    showNotification(`${prayerName} Prayer`, {
      body: `It's time for ${prayerName} prayer.`,
    });
  }, diff - 60000);
}

export function scheduleDailyReminder(hour: number = 8, minute: number = 0): void {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  const diff = target.getTime() - now.getTime();

  setTimeout(() => {
    showNotification('Daily Quran Reminder', {
      body: 'Time for your daily Quran reading!',
    });
    setInterval(() => {
      showNotification('Daily Quran Reminder', {
        body: 'Time for your daily Quran reading!',
      });
    }, 86400000);
  }, diff);
}
