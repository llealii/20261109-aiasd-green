export type Task = {
  id: string;
  title: string;
  status: 'Open';
  dueDate?: string;
};

export type TaskInput = { title: string; dueDate: string };

export type ValidationErrors = { title?: string; dueDate?: string };

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidDateOnly(value: string): boolean {
  const m = DATE_ONLY.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

export function validateTaskInput(input: TaskInput): ValidationErrors {
  const errors: ValidationErrors = {};
  if (input.title.trim() === '') errors.title = 'Title is required.';
  if (input.dueDate !== '' && !isValidDateOnly(input.dueDate)) {
    errors.dueDate = 'Due date must be a valid calendar date.';
  }
  return errors;
}

export function buildTask(input: TaskInput): Task {
  const task: Task = { id: crypto.randomUUID(), title: input.title, status: 'Open' };
  if (input.dueDate !== '') task.dueDate = input.dueDate;
  return task;
}

export function formatDueDate(value: string): string {
  const m = DATE_ONLY.exec(value);
  if (!m) return value;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
