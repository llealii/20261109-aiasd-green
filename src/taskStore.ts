export type TaskStatus = 'Open'

export interface Task {
  id: string
  title: string
  status: TaskStatus
  dueDate?: string
  createdAt: string
}

export interface TaskStore {
  list(): Promise<Task[]>
  add(input: { title: string; dueDate?: string }): Promise<Task>
}

export class TitleRequiredError extends Error {
  constructor() {
    super('Title is required.')
  }
}

const DB_NAME = 'task-manager'
const STORE = 'tasks'

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('Storage request failed.'))
  })
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available.'))
      return
    }
    const open = indexedDB.open(DB_NAME, 1)
    open.onupgradeneeded = () => {
      open.result.createObjectStore(STORE, { keyPath: 'id' })
    }
    open.onsuccess = () => resolve(open.result)
    open.onerror = () => reject(open.error ?? new Error('Could not open storage.'))
    open.onblocked = () => reject(new Error('Storage is blocked.'))
  })
}

export const indexedDbTaskStore: TaskStore = {
  async list() {
    const db = await openDb()
    try {
      const tasks = await request(
        db.transaction(STORE, 'readonly').objectStore(STORE).getAll(),
      )
      return (tasks as Task[]).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    } finally {
      db.close()
    }
  },

  async add({ title, dueDate }) {
    const trimmed = title.trim()
    if (!trimmed) throw new TitleRequiredError()
    const task: Task = {
      id: crypto.randomUUID(),
      title: trimmed,
      status: 'Open',
      createdAt: new Date().toISOString(),
      ...(dueDate ? { dueDate } : {}),
    }
    const db = await openDb()
    try {
      const tx = db.transaction(STORE, 'readwrite')
      const done = new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error ?? new Error('Save failed.'))
        tx.onabort = () => reject(tx.error ?? new Error('Save was aborted.'))
      })
      tx.objectStore(STORE).add(task)
      await done
      return task
    } finally {
      db.close()
    }
  },
}
