let swRegistration: ServiceWorkerRegistration | null = null;

// Get or generate persistent User/Device ID
export const getUserId = (): string => {
  let userId = localStorage.getItem('taskpulse_user_id');
  if (!userId) {
    userId = `user_${crypto.randomUUID()}`;
    localStorage.setItem('taskpulse_user_id', userId);
  }
  return userId;
};

// Helper: Convert VAPID Base64 key to Uint8Array for PushManager
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      swRegistration = await navigator.serviceWorker.register('/service-worker.js');
      // Attempt push registration if permission already granted
      if (Notification.permission === 'granted') {
        await registerWebPushSubscription();
      }
    } catch (err) {
      console.warn('Service Worker registration failed:', err);
    }
  }
};

export const registerWebPushSubscription = async (): Promise<boolean> => {
  if (!swRegistration || !('pushManager' in swRegistration)) return false;

  try {
    // 1. Fetch VAPID public key from backend
    const res = await fetch('/api/vapid-public-key');
    const { publicKey } = await res.json();
    if (!publicKey) return false;

    // 2. Subscribe to PushManager
    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    let subscription = await swRegistration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    // 3. Post subscription to backend server
    const userId = getUserId();
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, subscription }),
    });

    return true;
  } catch (err) {
    console.warn('Web Push subscription failed:', err);
    return false;
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;

  if (Notification.permission === 'granted') {
    await registerWebPushSubscription();
    return true;
  }
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    await registerWebPushSubscription();
    return true;
  }
  return false;
};

export const scheduleServerNotification = async (
  taskId: string,
  title: string,
  endTime: number
) => {
  try {
    const userId = getUserId();
    await fetch('/api/schedule-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, title, endTime, userId }),
    });
  } catch (err) {
    console.warn('Schedule server notification failed:', err);
  }
};

export const cancelServerNotification = async (taskId: string) => {
  try {
    await fetch('/api/cancel-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    });
  } catch (err) {
    console.warn('Cancel server notification failed:', err);
  }
};

export const sendTaskExpiredNotification = async (taskTitle: string, durationLabel: string) => {
  const title = "TIME'S UP!";
  const body = `Your task "${taskTitle}" (${durationLabel}) has reached its time limit.`;

  // Check if running on iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isIOS) {
    // iOS doesn't support Notification API - use vibration + alert
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
    
    // Show alert for iOS as fallback
    setTimeout(() => {
      alert(`⏰ ${title}\n\n${body}`);
    }, 100);
  } else {
    // Android, PC, and other platforms - show local notification
    // Note: Web Push notification from server is separate and shows in notification area
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.svg',
          tag: `task-expired-${taskTitle}`,
          requireInteraction: true,
        });
      } catch (err) {
        console.warn('Local notification failed:', err);
      }
    }
  }
};

