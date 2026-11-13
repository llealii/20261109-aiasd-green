import { useEffect, useState, type FormEvent } from 'react';
import { buildTask, formatDueDate, validateTaskInput, type Task, type ValidationErrors } from './task';
import type { TaskStore } from './taskStore';

type Props = { store: TaskStore };
type Feedback = { kind: 'success' | 'error'; message: string } | null;

export function App({ store }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    store
      .list()
      .then((saved) => {
        if (!active) return;
        setTasks(saved);
        setLoadState('ready');
      })
      .catch(() => {
        if (active) setLoadState('error');
      });
    return () => {
      active = false;
    };
  }, [store]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFeedback(null);
    if (loadState !== 'ready') {
      setFeedback({
        kind: 'error',
        message:
          loadState === 'error'
            ? 'Saved tasks could not be loaded. Reload the page before saving.'
            : 'Tasks are still loading. Please wait before saving.',
      });
      return;
    }
    const found = validateTaskInput({ title, dueDate });
    const dateInput = event.currentTarget.querySelector<HTMLInputElement>('#task-due');
    if (dateInput?.validity.badInput) {
      found.dueDate = 'Due date must be a valid calendar date.';
    }
    setErrors(found);
    if (found.title || found.dueDate) {
      setFeedback({ kind: 'error', message: [found.title, found.dueDate].filter(Boolean).join(' ') });
      return;
    }
    const task = buildTask({ title, dueDate });
    setSaving(true);
    try {
      await store.add(task);
      setTasks((current) => [...current, task]);
      setTitle('');
      setDueDate('');
      setFeedback({ kind: 'success', message: 'Task saved.' });
    } catch {
      setFeedback({ kind: 'error', message: 'Task could not be saved. Your input is kept; please try again.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <h1>Tasks</h1>
      <form onSubmit={onSubmit} noValidate aria-labelledby="capture-heading">
        <h2 id="capture-heading">Capture a task</h2>
        <div className="field">
          <label htmlFor="task-title">Title</label>
          <input
            id="task-title"
            type="text"
            value={title}
            disabled={saving}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? 'title-error' : undefined}
          />
          {errors.title && (
            <p id="title-error" className="error">
              {errors.title}
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor="task-due">Due date (optional)</label>
          <input
            id="task-due"
            type="date"
            value={dueDate}
            disabled={saving}
            onChange={(e) => setDueDate(e.target.value)}
            aria-invalid={errors.dueDate ? true : undefined}
            aria-describedby={errors.dueDate ? 'due-error' : undefined}
          />
          {errors.dueDate && (
            <p id="due-error" className="error">
              {errors.dueDate}
            </p>
          )}
        </div>
        <button type="submit" disabled={saving || loadState !== 'ready'}>
          Save task
        </button>
        <div role={feedback?.kind === 'error' ? 'alert' : 'status'} className={feedback?.kind ?? ''}>
          {feedback?.message}
        </div>
      </form>

      <section aria-labelledby="list-heading">
        <h2 id="list-heading">Your tasks</h2>
        {loadState === 'loading' && <p role="status">Loading tasks…</p>}
        {loadState === 'error' && <p role="alert" className="error">Saved tasks could not be loaded. Reload the page before saving.</p>}
        {loadState === 'ready' && tasks.length === 0 && <p>No tasks yet. Add your first task above.</p>}
        {loadState === 'ready' && tasks.length > 0 && (
          <ul>
            {tasks.map((task) => (
              <li key={task.id}>
                <span className="title">{task.title}</span>
                <span>Status: {task.status}</span>
                {task.dueDate && (
                  <span>
                    Due: <time dateTime={task.dueDate}>{formatDueDate(task.dueDate)}</time>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
