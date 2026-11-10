import { SemakKemajuanResult } from '../types/hafazan';

const NOTIFICATION_LAST_DATE_KEY = 'hafazan_notif_last_date';
const NOTIFICATION_ENABLED_KEY = 'hafazan_notif_enabled';

// Jam 8.15 malam (20:15)
export const TARGET_HOUR = 20;
export const TARGET_MINUTE = 15;

/**
 * Mendapatkan surah terkini yang sedang dihafaz oleh murid:
 * Surah pertama dalam senarai yang belum lengkap (got === null atau got < max).
 */
export function getCurrentSurah(student: SemakKemajuanResult): string {
  if (!student.surahs || student.surahs.length === 0) {
    return 'Al-Fatihah';
  }

  const inProgress = student.surahs.find((s) => s.got === null || (s.got !== null && s.got < s.max));
  if (inProgress) {
    return inProgress.n;
  }

  // Jika semua sudah selesai
  return student.surahs[student.surahs.length - 1].n;
}

/**
 * Format teks notifikasi rasmi mengikut arahan pengguna:
 * Perhatian ‼️ "Nama murid" kini sedang menghafal surah "terkini". Teruskan menghafal surah ♥️
 */
export function formatDailyNotificationBody(studentName: string, currentSurah: string): string {
  return `Perhatian ‼️ "${studentName}" kini sedang menghafal surah "${currentSurah}". Teruskan menghafal surah ♥️`;
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export function isDailyNotificationEnabled(): boolean {
  try {
    return localStorage.getItem(NOTIFICATION_ENABLED_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function setDailyNotificationEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(NOTIFICATION_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    console.error('Failed saving notification preference:', e);
  }
}

/**
 * Memohon kebenaran notifikasi dari pengguna
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setDailyNotificationEnabled(true);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return false;
  }
}

/**
 * Menghantar notifikasi terus ke peranti (menggunakan Service Worker jika ada untuk PWA mobile)
 */
export async function triggerDeviceNotification(
  student: SemakKemajuanResult,
  options?: { force?: boolean }
): Promise<{ success: boolean; message: string }> {
  if (!isNotificationSupported()) {
    return {
      success: false,
      message: 'Pelayar ini tidak menyokong notifikasi sistem peranti.',
    };
  }

  if (Notification.permission !== 'granted') {
    const granted = await requestNotificationPermission();
    if (!granted) {
      return {
        success: false,
        message: 'Kebenaran notifikasi belum diaktifkan dalam pelayar/telefon anda.',
      };
    }
  }

  const currentSurah = getCurrentSurah(student);
  const title = 'Peringatan Hafazan SPPIM 📖';
  const bodyText = formatDailyNotificationBody(student.name, currentSurah);

  interface MobileNotificationOptions extends NotificationOptions {
    renotify?: boolean;
    vibrate?: number[];
  }

  const notifOptions: MobileNotificationOptions = {
    body: bodyText,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: `hafazan-daily-${student.ic}`,
    renotify: true,
    data: {
      url: window.location.href,
      ic: student.ic,
    },
    vibrate: [200, 100, 200],
  };

  try {
    // 1. Cuba hantar melalui Service Worker (terbaik untuk PWA telefon / Android & iOS 16.4+)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, notifOptions as unknown as NotificationOptions);
          markNotificationSentToday();
          return { success: true, message: 'Notifikasi jam 8.15 malam berjaya dihantar ke skrin telefon!' };
        }
      } catch (swErr) {
        console.warn('Service worker notification failed, falling back to standard Notification:', swErr);
      }
    }

    // 2. Fallback kepada Web Notification standard
    new Notification(title, notifOptions as unknown as NotificationOptions);
    markNotificationSentToday();
    return { success: true, message: 'Notifikasi jam 8.15 malam berjaya dihantar!' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Gagal memaparkan notifikasi: ${errorMsg}` };
  }
}

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function markNotificationSentToday(): void {
  try {
    localStorage.setItem(NOTIFICATION_LAST_DATE_KEY, getTodayDateString());
  } catch {}
}

export function hasSentNotificationToday(): boolean {
  try {
    const lastDate = localStorage.getItem(NOTIFICATION_LAST_DATE_KEY);
    return lastDate === getTodayDateString();
  } catch {
    return false;
  }
}

/**
 * Mendapatkan tarikh dan masa sasaran 8.15 malam seterusnya
 */
export function getNext815PMScheduledDate(): Date {
  const now = new Date();
  const target = new Date();
  target.setHours(TARGET_HOUR, TARGET_MINUTE, 0, 0);

  // Jika hari ini sudah melepasi jam 8.15 malam, jadualkan untuk esok
  if (now.getTime() >= target.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target;
}

/**
 * Format paparan jadual waktu notifikasi dalam Bahasa Melayu
 */
export function getNextScheduledText(): string {
  const now = new Date();
  const today815PM = new Date();
  today815PM.setHours(TARGET_HOUR, TARGET_MINUTE, 0, 0);

  if (now.getTime() < today815PM.getTime()) {
    return 'Hari ini jam 8.15 malam';
  }
  return 'Esok jam 8.15 malam';
}

/**
 * Semak automatik jika sekarang sudah melepasi jam 8.15 malam:
 * Jika sekarang >= 8.15 malam dan belum dihantar untuk hari ini, hantar terus.
 */
export async function checkAndTrigger815PMReminder(student: SemakKemajuanResult): Promise<void> {
  if (!isNotificationSupported()) return;
  if (!isDailyNotificationEnabled()) return;
  if (Notification.permission !== 'granted') return;

  const now = new Date();
  const targetTimeToday = new Date();
  targetTimeToday.setHours(TARGET_HOUR, TARGET_MINUTE, 0, 0);

  // Semak jika sudah tiba atau melepasi jam 8.15 malam hari ini
  if (now.getTime() >= targetTimeToday.getTime()) {
    if (!hasSentNotificationToday()) {
      await triggerDeviceNotification(student);
    }
  }
}

let activeReminderTimer: NodeJS.Timeout | null = null;

/**
 * Menjadualkan pemasa tepat jam 8.15 malam setiap hari
 */
export function scheduleDaily815PMReminder(student: SemakKemajuanResult): () => void {
  if (activeReminderTimer) {
    clearTimeout(activeReminderTimer);
    activeReminderTimer = null;
  }

  // 1. Semak serta-merta jika hari ini sudah lepas 8.15 malam tapi belum terima
  checkAndTrigger815PMReminder(student);

  // 2. Kira milisaat hingga jam 8.15 malam seterusnya
  const nextTarget = getNext815PMScheduledDate();
  const delayMs = Math.max(1000, nextTarget.getTime() - Date.now());

  activeReminderTimer = setTimeout(async () => {
    if (isDailyNotificationEnabled() && Notification.permission === 'granted') {
      await triggerDeviceNotification(student);
    }
    // Jadualkan semula untuk hari berikutnya
    scheduleDaily815PMReminder(student);
  }, delayMs);

  // Handler jika pengguna membuka telefon atau kembali ke aplikasi
  const visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      checkAndTrigger815PMReminder(student);
    }
  };

  document.addEventListener('visibilitychange', visibilityHandler);

  return () => {
    if (activeReminderTimer) {
      clearTimeout(activeReminderTimer);
      activeReminderTimer = null;
    }
    document.removeEventListener('visibilitychange', visibilityHandler);
  };
}
