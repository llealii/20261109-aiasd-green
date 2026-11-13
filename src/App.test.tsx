import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { indexedDbTaskStore, type TaskStore } from './taskStore'

beforeEach(async () => {
  await new Promise((resolve) => {
    const req = indexedDB.deleteDatabase('task-manager')
    req.onsuccess = req.onerror = () => resolve(undefined)
  })
})

it('shows empty state', async () => {
  render(<App />)
  expect(await screen.findByText('No tasks yet.')).toBeInTheDocument()
})

it('creates a task without due date', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.type(await screen.findByLabelText('Title'), '  Buy milk ')
  await user.click(screen.getByRole('button', { name: 'Add task' }))
  expect(await screen.findByText('Task saved.')).toBeInTheDocument()
  const items = screen.getAllByRole('listitem')
  expect(items).toHaveLength(1)
  expect(items[0]).toHaveTextContent('Buy milk')
  expect(items[0]).toHaveTextContent('Status: Open')
  expect(items[0]).not.toHaveTextContent('Due')
})

it('keeps due date unchanged and persists across reopen', async () => {
  const user = userEvent.setup()
  const first = render(<App />)
  await user.type(await screen.findByLabelText('Title'), 'File taxes')
  await user.type(screen.getByLabelText('Due date (optional)'), '2026-12-31')
  await user.click(screen.getByRole('button', { name: 'Add task' }))
  await screen.findByText('Task saved.')
  first.unmount()

  render(<App />)
  const item = await screen.findByRole('listitem')
  expect(item).toHaveTextContent('File taxes')
  expect(item).toHaveTextContent('Status: Open')
  expect(item).toHaveTextContent('Due: 2026-12-31')
})

it('rejects whitespace-only title', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.type(await screen.findByLabelText('Title'), '   ')
  await user.click(screen.getByRole('button', { name: 'Add task' }))
  expect(await screen.findByText('Title is required.')).toBeInTheDocument()
  expect(screen.queryByRole('listitem')).toBeNull()
  expect(await indexedDbTaskStore.list()).toEqual([])
})

it('reports storage failure without success state', async () => {
  const user = userEvent.setup()
  const failing: TaskStore = {
    list: async () => [],
    add: async () => {
      throw new Error('disk full')
    },
  }
  render(<App store={failing} />)
  await user.type(await screen.findByLabelText('Title'), 'Task')
  await user.click(screen.getByRole('button', { name: 'Add task' }))
  expect(await screen.findByText(/Could not save the task/)).toBeInTheDocument()
  expect(screen.queryByText('Task saved.')).toBeNull()
  expect(screen.queryByRole('listitem')).toBeNull()
  expect(screen.getByLabelText('Title')).toHaveValue('Task')
})
