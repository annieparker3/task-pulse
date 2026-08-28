import webPush from 'web-push';

// In-memory / file-persisted data structures
const subscriptions = new Map(); // userId -> PushSubscription
const scheduledTasks = new Map(); // taskId -> { timerId, taskData }

export function initWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@taskpulse.app';

  if (!publicKey || !privateKey) {
    console.error('Missing VAPID keys in environment variables');
    return;
  }

  webPush.setVapidDetails(subject, publicKey, privateKey);
}

export function saveSubscription(userId, subscription) {
  subscriptions.set(userId, subscription);
}

export function getSubscription(userId) {
  return subscriptions.get(userId);
}

export function scheduleNotification({ taskId, title, endTime, userId }) {
  // Cancel any existing timer for this task first
  cancelNotification(taskId);

  const delay = Math.max(0, endTime - Date.now());

  const timerId = setTimeout(async () => {
    const taskEntry = scheduledTasks.get(taskId);
    if (!taskEntry) return;

    const subscription = subscriptions.get(userId) || taskEntry.subscription;
    if (subscription) {
      const payload = JSON.stringify({
        title: "TIME'S UP!",
        body: `Your task "${title}" has reached its time limit.`,
        taskId: taskId,
      });

      try {
        console.log(`[Push] Sending notification for task "${title}" (${taskId}) to user ${userId}`);
        await webPush.sendNotification(subscription, payload);
        console.log(`[Push] Notification sent successfully for task ${taskId}`);
      } catch (err) {
        console.error(`[Push] Error sending notification for task ${taskId}:`, err.message);
      }
    } else {
      console.warn(`[Push] No subscription found for user ${userId}, task ${taskId}`);
    }

    scheduledTasks.delete(taskId);
  }, delay);

  scheduledTasks.set(taskId, {
    timerId,
    taskData: { taskId, title, endTime, userId },
    subscription: subscriptions.get(userId),
  });

  console.log(`[Push] Scheduled notification for task "${title}" in ${Math.round(delay / 1000)}s`);
}

export function cancelNotification(taskId) {
  const existing = scheduledTasks.get(taskId);
  if (existing) {
    clearTimeout(existing.timerId);
    scheduledTasks.delete(taskId);
  }
}

export function getScheduledTask(taskId) {
  return scheduledTasks.get(taskId);
}
