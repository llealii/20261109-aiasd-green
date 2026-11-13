import type { Task } from './task';

export interface TaskStore {
  list(): Promise<Task[]>;
  add(task: Task): Promise<void>;
}

const DB_NAME = 'task-manager';
const DB_VERSION = 1;
const STORE = 'tasks';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open storage.'));
    request.onblocked = () => reject(new Error('Storage is blocked.'));
  });
}

export function createIndexedDbTaskStore(): TaskStore {
  return {
    async list() {
      const db = await openDb();
      try {
        return await new Promise<Task[]>((resolve, reject) => {
          const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
          request.onsuccess = () => resolve(request.result as Task[]);
          request.onerror = () => reject(request.error ?? new Error('Unable to read tasks.'));
        });
      } finally {
        db.close();
      }
    },
    async add(task) {
      const db = await openDb();
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).add(task);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error ?? new Error('Unable to save task.'));
          tx.onabort = () => reject(tx.error ?? new Error('Save was aborted.'));
        });
      } finally {
        db.close();
      }
    },
  };
}
