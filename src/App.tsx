import { useEffect, useState, type FormEvent } from 'react'
import {
  indexedDbTaskStore,
  TitleRequiredError,
  type Task,
  type TaskStore,
} from './taskStore'
import './index.css'

type Notice = { kind: 'saved' | 'error'; text: string } | null

export default function App({ store = indexedDbTaskStore }: { store?: TaskStore }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [titleError, setTitleError] = useState('')
  const [notice, setNotice] = useState<Notice>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    store
      .list()
      .then((result) => {
        if (active) setTasks(result)
      })
      .catch(() => {
        if (active) setLoadError(true)
      })
      .finally(() => {
        if (active) setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [store])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setNotice(null)
    if (!title.trim()) {
      setTitleError('Title is required.')
      return
    }
    setTitleError('')
    setSaving(true)
    try {
      const task = await store.add({ title, dueDate: dueDate || undefined })
      setTasks((current) => [...current, task])
      setTitle('')
      setDueDate('')
      setNotice({ kind: 'saved', text: 'Task saved.' })
    } catch (error) {
      setNotice(
        error instanceof TitleRequiredError
          ? { kind: 'error', text: error.message }
          : { kind: 'error', text: 'Could not save the task. Your input was kept; please try again.' },
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main>
      <h1>Task Manager</h1>
      <form onSubmit={onSubmit} noValidate>
        <div>
          <label htmlFor="task-title">Title</label>
          <input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={titleError ? true : undefined}
            aria-describedby={titleError ? 'task-title-error' : undefined}
          />
          {titleError && (
            <p id="task-title-error" className="error">
              {titleError}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="task-due">Due date (optional)</label>
          <input
            id="task-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <button type="submit" disabled={saving}>
          Add task
        </button>
      </form>
      <div role="status" aria-live="polite">
        {notice && <p className={notice.kind}>{notice.kind === 'error' ? 'Error: ' : ''}{notice.text}</p>}
      </div>

      <h2>Tasks</h2>
      {loadError && (
        <p role="alert" className="error">
          Error: Could not load saved tasks.
        </p>
      )}
      {loaded && !loadError && tasks.length === 0 && <p>No tasks yet.</p>}
      {tasks.length > 0 && (
        <ul aria-label="Tasks">
          {tasks.map((task) => (
            <li key={task.id}>
              <span>{task.title}</span> — <span>Status: {task.status}</span>
              {task.dueDate && <span> — Due: {task.dueDate}</span>}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
