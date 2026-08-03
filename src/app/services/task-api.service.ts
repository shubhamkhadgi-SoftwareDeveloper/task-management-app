import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Task, CreateTaskDto, UpdateTaskDto } from '../models/task.model';

const SIMULATED_LATENCY_MS = 400;

const SEED_TASKS: Task[] = [
  {
    id: '1',
    title: 'Set up project scaffolding',
    description: 'Initialize the Angular project with routing and linting configured.',
    status: 'completed',
    priority: 'high',
    dueDate: '2026-07-20',
    createdAt: '2026-07-15T09:00:00Z',
    updatedAt: '2026-07-20T11:00:00Z',
  },
  {
    id: '2',
    title: 'Design data models',
    description: 'Define TypeScript interfaces for Task, DTOs, and filter types.',
    status: 'completed',
    priority: 'high',
    dueDate: '2026-07-22',
    createdAt: '2026-07-15T09:05:00Z',
    updatedAt: '2026-07-22T10:00:00Z',
  },
  {
    id: '3',
    title: 'Build task list UI',
    description: 'Create the task list component with filtering and sorting capabilities.',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2026-08-05',
    createdAt: '2026-07-23T08:00:00Z',
    updatedAt: '2026-07-30T14:00:00Z',
  },
  {
    id: '4',
    title: 'Implement reactive form',
    description: 'Add create/edit task form using Angular Reactive Forms with validation.',
    status: 'in-progress',
    priority: 'medium',
    dueDate: '2026-08-06',
    createdAt: '2026-07-23T08:10:00Z',
    updatedAt: '2026-07-31T09:00:00Z',
  },
  {
    id: '5',
    title: 'Write unit tests',
    description: 'Cover state service and form component with meaningful Jasmine/Karma tests.',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-08-10',
    createdAt: '2026-07-24T10:00:00Z',
    updatedAt: '2026-07-24T10:00:00Z',
  },
  {
    id: '6',
    title: 'Accessibility audit',
    description: 'Run axe-core against the app and fix any WCAG 2.1 AA violations.',
    status: 'todo',
    priority: 'low',
    dueDate: '2026-07-25',
    createdAt: '2026-07-25T11:00:00Z',
    updatedAt: '2026-07-25T11:00:00Z',
  },
];

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private store = new Map<string, Task>(SEED_TASKS.map((t) => [t.id, { ...t }]));
  private nextId = SEED_TASKS.length + 1;

  getAll(): Observable<Task[]> {
    return of([...this.store.values()]).pipe(delay(SIMULATED_LATENCY_MS));
  }

  getById(id: string): Observable<Task> {
    const task = this.store.get(id);
    if (!task) {
      return throwError(() => new Error(`Task "${id}" not found`)).pipe(
        delay(SIMULATED_LATENCY_MS),
      );
    }
    return of({ ...task }).pipe(delay(SIMULATED_LATENCY_MS));
  }

  create(dto: CreateTaskDto): Observable<Task> {
    const now = new Date().toISOString();
    const task: Task = { ...dto, id: String(this.nextId++), createdAt: now, updatedAt: now };
    this.store.set(task.id, task);
    return of({ ...task }).pipe(delay(SIMULATED_LATENCY_MS));
  }

  update(id: string, dto: UpdateTaskDto): Observable<Task> {
    const existing = this.store.get(id);
    if (!existing) {
      return throwError(() => new Error(`Task "${id}" not found`)).pipe(
        delay(SIMULATED_LATENCY_MS),
      );
    }
    const updated: Task = { ...existing, ...dto, id, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return of({ ...updated }).pipe(delay(SIMULATED_LATENCY_MS));
  }

  delete(id: string): Observable<void> {
    if (!this.store.has(id)) {
      return throwError(() => new Error(`Task "${id}" not found`)).pipe(
        delay(SIMULATED_LATENCY_MS),
      );
    }
    this.store.delete(id);
    return of(undefined).pipe(delay(SIMULATED_LATENCY_MS));
  }
}
