import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IDBFactory } from 'fake-indexeddb';
import { App } from './App';
import { createIndexedDbTaskStore, type TaskStore } from './taskStore';

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

async function add(title: string, due?: string) {
  const user = userEvent.setup();
  if (title) await user.type(screen.getByLabelText('Title'), title);
  else await user.click(screen.getByLabelText('Title'));
  if (due) await user.type(screen.getByLabelText(/Due date/), due);
  await user.click(screen.getByRole('button', { name: 'Save task' }));
}

it('shows an empty state', async () => {
  render(<App store={createIndexedDbTaskStore()} />);
  expect(await screen.findByText(/No tasks yet/)).toBeInTheDocument();
});

it('creates a task without a due date (AC-001)', async () => {
  render(<App store={createIndexedDbTaskStore()} />);
  await screen.findByText(/No tasks yet/);
  await add('Buy milk');
  const items = await screen.findAllByRole('listitem');
  expect(items).toHaveLength(1);
  expect(within(items[0]!).getByText('Buy milk')).toBeInTheDocument();
  expect(items[0]).toHaveTextContent('Status: Open');
  expect(items[0]).not.toHaveTextContent('Due');
});

it('creates a task with a date-only due date unchanged (AC-002)', async () => {
  const store = createIndexedDbTaskStore();
  render(<App store={store} />);
  await screen.findByText(/No tasks yet/);
  await add('Pay rent', '2026-03-01');
  await screen.findByText('Task saved.');
  const saved = await store.list();
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({ title: 'Pay rent', status: 'Open', dueDate: '2026-03-01' });
  expect(screen.getByRole('listitem')).toHaveTextContent('Due:');
});

it('rejects whitespace-only titles (AC-003)', async () => {
  const store = createIndexedDbTaskStore();
  render(<App store={store} />);
  await screen.findByText(/No tasks yet/);
  await add('   ');
  expect(
    await within(screen.getByRole('form', { name: 'Capture a task' })).findByRole('alert'),
  ).toHaveTextContent('Title is required.');
  expect(await store.list()).toHaveLength(0);
});

it('rejects native invalid date input without saving (AC-009)', async () => {
  const store = createIndexedDbTaskStore();
  render(<App store={store} />);
  await screen.findByText(/No tasks yet/);
  const input = screen.getByLabelText(/Due date/) as HTMLInputElement;
  Object.defineProperty(input, 'validity', { configurable: true, value: { badInput: true } });
  await add('Invalid date');
  expect(within(screen.getByRole('form', { name: 'Capture a task' })).getByRole('alert')).toHaveTextContent(
    'Due date must be a valid calendar date.',
  );
  expect(await store.list()).toHaveLength(0);
});

it('rejects an impossible date (AC-009)', async () => {
  const store = createIndexedDbTaskStore();
  render(<App store={store} />);
  await screen.findByText(/No tasks yet/);
  const input = screen.getByLabelText(/Due date/) as HTMLInputElement;
  // jsdom sanitizes impossible dates; verify through the validator
  const { validateTaskInput } = await import('./task');
  expect(validateTaskInput({ title: 'x', dueDate: '2026-02-30' }).dueDate).toMatch(/valid calendar date/);
  expect(input).toBeInTheDocument();
});

it('keeps form inputs disabled until a pending save completes', async () => {
  let finishSave!: () => void;
  const store: TaskStore = {
    list: async () => [],
    add: () => new Promise<void>((resolve) => {
      finishSave = resolve;
    }),
  };
  render(<App store={store} />);
  await screen.findByText(/No tasks yet/);
  const user = userEvent.setup();
  const title = screen.getByLabelText('Title');
  const dueDate = screen.getByLabelText(/Due date/);
  await user.type(title, 'Pending task');
  await user.click(screen.getByRole('button', { name: 'Save task' }));
  expect(title).toBeDisabled();
  expect(dueDate).toBeDisabled();
  await act(async () => finishSave());
  expect(await screen.findByText('Task saved.')).toBeInTheDocument();
  expect(title).toHaveValue('');
});

it('does not save after the initial task load fails', async () => {
  let addCount = 0;
  const store: TaskStore = {
    list: async () => {
      throw new Error('unavailable');
    },
    add: async () => {
      addCount += 1;
    },
  };
  render(<App store={store} />);
  expect(await screen.findByRole('alert')).toHaveTextContent(/reload/i);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Title'), 'Keep this draft');
  expect(screen.getByRole('button', { name: 'Save task' })).toBeDisabled();
  const form = screen.getByRole('form', { name: 'Capture a task' });
  fireEvent.submit(form);
  expect(within(form).getByRole('alert')).toHaveTextContent(/reload the page before saving/i);
  expect(screen.getByLabelText('Title')).toHaveValue('Keep this draft');
  expect(addCount).toBe(0);
});

it('keeps saved tasks after reopening (AC-005)', async () => {
  const first = render(<App store={createIndexedDbTaskStore()} />);
  await screen.findByText(/No tasks yet/);
  await add('Persist me', '2026-12-25');
  await screen.findByText('Task saved.');
  first.unmount();
  render(<App store={createIndexedDbTaskStore()} />);
  const item = await screen.findByRole('listitem');
  expect(item).toHaveTextContent('Persist me');
  expect(item).toHaveTextContent('Status: Open');
  expect(item).toHaveTextContent('Due:');
});

it('reports save failure without success (AC-006)', async () => {
  const failing: TaskStore = {
    list: async () => [],
    add: async () => {
      throw new Error('quota');
    },
  };
  render(<App store={failing} />);
  await screen.findByText(/No tasks yet/);
  await add('Will fail');
  expect(await screen.findByRole('alert')).toHaveTextContent('could not be saved');
  expect(screen.queryByText('Task saved.')).not.toBeInTheDocument();
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
});
