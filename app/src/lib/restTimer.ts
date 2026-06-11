/* ============================================================
   Rest timer — timestamp-based so it survives backgrounding,
   screen-lock, tab switches and full reloads. Persisted to
   localStorage (ephemeral UI state, no need for Firestore).

   Notifications are best-effort: registration.showNotification
   fires while the PWA is open or backgrounded-but-alive. iOS
   gives no client-only API to guarantee delivery once the app is
   fully terminated, so a timer that expires while the app is
   killed simply won't notify (and is dropped on next launch).
   ============================================================ */

const KEY = 'workout.restTimer.v1';

export interface RestTimer {
  id: number; // unique per start (React key + notification de-dupe)
  total: number; // baseline seconds for the ring
  endAt: number | null; // epoch ms when it ends, while running
  pausedRemaining: number | null; // seconds left, while paused
}

/** Seconds remaining for a timer at `now`. */
export function timerLeft(t: RestTimer, now: number = Date.now()): number {
  if (t.pausedRemaining != null) return Math.max(0, t.pausedRemaining);
  if (t.endAt != null) return Math.max(0, Math.round((t.endAt - now) / 1000));
  return 0;
}

/** Restore a persisted timer, dropping one that already finished while closed. */
export function loadRestTimer(): RestTimer | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const t = JSON.parse(raw) as RestTimer;
    if (typeof t?.id !== 'number') return null;
    if (t.pausedRemaining == null && (t.endAt == null || timerLeft(t) <= 0)) {
      localStorage.removeItem(KEY);
      return null;
    }
    return t;
  } catch {
    return null;
  }
}

export function saveRestTimer(t: RestTimer | null): void {
  try {
    if (t) localStorage.setItem(KEY, JSON.stringify(t));
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode / quota — timer just won't survive a reload */
  }
}

/** Ask for notification permission (call from a user gesture). */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

/** Show the "rest complete" notification through the service worker. */
export async function fireRestNotification(): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const title = 'Rest complete';
  const icon = `${import.meta.env.BASE_URL}apple-touch-icon.png`;
  const options: NotificationOptions = {
    body: 'Time for your next set.',
    tag: 'rest-timer',
    icon,
    badge: icon,
  };
  // iOS PWAs only support notifications via the SW registration, so prefer it.
  if ('serviceWorker' in navigator) {
    try {
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((res) => setTimeout(() => res(null), 800)),
      ]);
      if (reg) {
        await reg.showNotification(title, options);
        return;
      }
    } catch {
      /* fall through to the page-level Notification */
    }
  }
  try {
    new Notification(title, options);
  } catch {
    /* not supported (e.g. iOS without an active SW) */
  }
}
