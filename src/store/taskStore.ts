import { create } from 'zustand';
import { db } from '../services/db';
import {
  getUserId,
  scheduleServerNotification,
  cancelServerNotification,
} from '../services/notificationService';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'expired';

export interface Task {
  id: string;                // taskId ("123")
  userId?: string;           // unique user/device ID
  title: string;
  durationMs: number;        // e.g. 2 * 60 * 60 * 1000
  createdAt: number;         // epoch ms
  scheduledStart?: number;   // optional epoch ms
  startedAt?: number;        // epoch ms (startTime)
  endTime?: number;          // epoch ms (startedAt + durationMs)
  completedAt?: number;      // epoch ms
  status: TaskStatus;
  notifiedExpired: boolean;
  notificationStatus?: 'scheduled' | 'sent' | 'cancelled';
}

interface TaskState {
  tasks: Task[];
  isLoaded: boolean;
  activeTab: 'timer' | 'tasks' | 'history' | 'settings';
  isAddTaskOpen: boolean;

  setActiveTab: (tab: 'timer' | 'tasks' | 'history' | 'settings') => void;
  setAddTaskOpen: (open: boolean) => void;

  loadTasks: () => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  extendTask: (id: string, additionalMs: number) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoaded: false,
  activeTab: 'timer',
  isAddTaskOpen: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setAddTaskOpen: (open) => set({ isAddTaskOpen: open }),

  loadTasks: async () => {
    try {
      const storedTasks = await db.getTasks();
      // Ensure all loaded tasks have a userId
      const currentUserId = getUserId();
      const normalized = storedTasks.map((t) => ({
        ...t,
        userId: t.userId || currentUserId,
      }));
      set({ tasks: normalized, isLoaded: true });
    } catch (error) {
      console.error('Failed to load tasks from IndexedDB', error);
      set({ isLoaded: true });
    }
  },

  addTask: async (task: Task) => {
    const taskWithUser = { ...task, userId: task.userId || getUserId() };
    await db.saveTask(taskWithUser);
    set((state) => ({ tasks: [...state.tasks, taskWithUser] }));

    if (taskWithUser.status === 'in_progress' && taskWithUser.endTime) {
      scheduleServerNotification(taskWithUser.id, taskWithUser.title, taskWithUser.endTime);
    }
  },

  updateTask: async (task: Task) => {
    const updatedTask: Task = {
      ...task,
      userId: task.userId || getUserId(),
      endTime: task.startedAt ? task.startedAt + task.durationMs : task.endTime,
    };

    await db.saveTask(updatedTask);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === task.id ? updatedTask : t)),
    }));

    if (updatedTask.status === 'in_progress' && updatedTask.endTime) {
      scheduleServerNotification(updatedTask.id, updatedTask.title, updatedTask.endTime);
    } else if (updatedTask.status === 'completed') {
      cancelServerNotification(updatedTask.id);
    }
  },

  extendTask: async (id: string, additionalMs: number) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const newDurationMs = task.durationMs + additionalMs;
    const now = Date.now();
    const startedAt = task.startedAt || now;
    const endTime = (task.status === 'expired' ? now : startedAt) + (task.status === 'expired' ? additionalMs : newDurationMs);

    const updatedTask: Task = {
      ...task,
      durationMs: newDurationMs,
      startedAt: task.startedAt || now,
      endTime,
      status: 'in_progress',
      notifiedExpired: false,
      notificationStatus: 'scheduled',
    };

    await db.saveTask(updatedTask);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
    }));

    scheduleServerNotification(updatedTask.id, updatedTask.title, endTime);
  },

  deleteTask: async (id: string) => {
    await db.deleteTask(id);
    cancelServerNotification(id);
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
  },
}));
