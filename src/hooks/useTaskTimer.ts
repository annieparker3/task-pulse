import { useState, useEffect, useCallback } from 'react';
import { useTaskStore, type Task } from '../store/taskStore';
import { playChime } from '../services/audioService';
import { sendTaskExpiredNotification, requestNotificationPermission } from '../services/notificationService';

export function useTaskTimer(task: Task) {
  const updateTask = useTaskStore((state) => state.updateTask);

  const calculateRemaining = useCallback(() => {
    if (task.status !== 'in_progress' || !task.startedAt) {
      return 0;
    }
    const endTime = task.startedAt + task.durationMs;
    return Math.max(0, endTime - Date.now());
  }, [task.status, task.startedAt, task.durationMs]);

  const [remainingMs, setRemainingMs] = useState(calculateRemaining);

  const handleExpiry = useCallback(
    async (currentTask: Task) => {
      if (!currentTask.notifiedExpired) {
        playChime();
        const durationMinutes = Math.floor(currentTask.durationMs / 60000);
        const durationLabel = durationMinutes >= 60 ? `${(durationMinutes / 60).toFixed(1)}h` : `${durationMinutes}m`;
        
        // Ensure notification permission is granted before showing notification
        if (Notification.permission !== 'granted') {
          await requestNotificationPermission();
        }
        
        await sendTaskExpiredNotification(currentTask.title, durationLabel);
      }

      updateTask({
        ...currentTask,
        status: 'expired',
        notifiedExpired: true,
      });
    },
    [updateTask]
  );

  useEffect(() => {
    if (task.status !== 'in_progress' || !task.startedAt) {
      return;
    }

    const initialRemaining = calculateRemaining();
    setRemainingMs(initialRemaining);

    if (initialRemaining <= 0) {
      handleExpiry(task);
      return;
    }

    const worker = new Worker(new URL('../workers/timerWorker.ts', import.meta.url), {
      type: 'module',
    });

    const updateTimer = () => {
      const remaining = calculateRemaining();
      setRemainingMs(remaining);
      if (remaining <= 0) {
        handleExpiry(task);
        worker.postMessage('stop');
      }
    };

    worker.onmessage = (e) => {
      if (e.data === 'tick') {
        updateTimer();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateTimer();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    worker.postMessage('start');

    return () => {
      worker.postMessage('stop');
      worker.terminate();
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [task, calculateRemaining, handleExpiry]);

  const progress = task.durationMs > 0 
    ? Math.min(1, Math.max(0, remainingMs / task.durationMs))
    : 0;

  return { remainingMs, progress };
}
export { requestNotificationPermission };
