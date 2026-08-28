import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  initWebPush,
  saveSubscription,
  scheduleNotification,
  cancelNotification,
  getScheduledTask,
} from './scheduler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// In production: allow all origins (served from same domain).
// In development: allow localhost:5174.
app.use(cors({
  origin: isProd ? true : 'http://localhost:5174',
}));
app.use(express.json());

initWebPush();

// Serve built React frontend as static files in production
if (isProd) {
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
}

// Return VAPID Public Key to Client
app.get('/api/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
});

// Save Web Push Subscription
app.post('/api/subscribe', (req, res) => {
  const { userId, subscription } = req.body;
  if (!userId || !subscription) {
    return res.status(400).json({ error: 'Missing userId or subscription' });
  }

  console.log(`[Subscribe] Saving subscription for user ${userId}`);
  saveSubscription(userId, subscription);
  res.json({ success: true });
});

// Schedule Background Notification
app.post('/api/schedule-notification', (req, res) => {
  const { taskId, title, endTime, userId } = req.body;
  if (!taskId || !endTime || !userId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  console.log(`[Schedule] Received request to schedule notification for task "${title}" (${taskId})`);
  scheduleNotification({ taskId, title: title || 'Task', endTime, userId });
  res.json({ success: true, message: `Notification scheduled for ${new Date(endTime).toISOString()}` });
});

// Cancel Notification
app.post('/api/cancel-notification', (req, res) => {
  const { taskId } = req.body;
  if (!taskId) {
    return res.status(400).json({ error: 'Missing taskId' });
  }

  cancelNotification(taskId);
  res.json({ success: true });
});

// Handle Notification Actions (from Service Worker notificationclick)
app.post('/api/action', (req, res) => {
  const { action, taskId } = req.body;
  if (!taskId || !action) {
    return res.status(400).json({ error: 'Missing action or taskId' });
  }

  if (action === 'mark_complete') {
    cancelNotification(taskId);
    res.json({ success: true, status: 'completed' });
  } else if (action === 'add_15m') {
    const existing = getScheduledTask(taskId);
    const newEndTime = (existing?.taskData?.endTime || Date.now()) + 15 * 60 * 1000;
    scheduleNotification({
      taskId,
      title: existing?.taskData?.title || 'Task',
      endTime: newEndTime,
      userId: existing?.taskData?.userId || 'unknown',
    });
    res.json({ success: true, newEndTime });
  } else {
    res.status(400).json({ error: 'Unknown action' });
  }
});

// SPA fallback — serve index.html for any non-API route in production
if (isProd) {
  app.get(/^(?!\/api\/).*$/, (req, res) => {
    res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`TaskPulse Web Push Server running on http://localhost:${PORT} [${isProd ? 'production' : 'development'}]`);
});
