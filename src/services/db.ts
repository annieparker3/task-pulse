import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Task } from '../store/taskStore';

interface TaskPulseDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
  };
}

let dbPromise: Promise<IDBPDatabase<TaskPulseDB>>;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<TaskPulseDB>('taskpulse-db', 1, {
      upgrade(db) {
        db.createObjectStore('tasks', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
};

export const db = {
  async getTasks(): Promise<Task[]> {
    const database = await getDB();
    return database.getAll('tasks');
  },
  
  async saveTask(task: Task): Promise<void> {
    const database = await getDB();
    await database.put('tasks', task);
  },
  
  async deleteTask(id: string): Promise<void> {
    const database = await getDB();
    await database.delete('tasks', id);
  }
};
