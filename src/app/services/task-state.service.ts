import { Injectable, computed, signal } from '@angular/core';
import { Task, CreateTaskDto, UpdateTaskDto, TaskFilter, TaskStats } from '../models/task.model';
import { TaskApiService } from './task-api.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class TaskStateService {
  private readonly _tasks = signal<Task[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filter = signal<TaskFilter>({ search: '', status: 'all', priority: 'all' });

  readonly tasks = this._tasks.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filter = this._filter.asReadonly();

  readonly filteredTasks = computed(() => {
    const { search, status, priority } = this._filter();
    const today = new Date().toISOString().split('T')[0];

    return this._tasks().filter((task) => {
      const matchesSearch =
        !search ||
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        (task.description ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === 'all' || task.status === status;
      const matchesPriority = priority === 'all' || task.priority === priority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  });

  readonly taskStats = computed((): TaskStats => {
    const tasks = this._tasks();
    const today = new Date().toISOString().split('T')[0];
    return {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      inProgress: tasks.filter((t) => t.status === 'in-progress').length,
      overdue: tasks.filter((t) => t.status !== 'completed' && t.dueDate < today).length,
    };
  });

  constructor(
    private api: TaskApiService,
    private toast: ToastService,
  ) {}

  loadTasks(): void {
    this._loading.set(true);
    this._error.set(null);
    this.api.getAll().subscribe({
      next: (tasks) => {
        this._tasks.set(tasks);
        this._loading.set(false);
      },
      error: (err: Error) => {
        this._error.set(err.message ?? 'Failed to load tasks');
        this._loading.set(false);
      },
    });
  }

  createTask(dto: CreateTaskDto): void {
    this._loading.set(true);
    this._error.set(null);
    this.api.create(dto).subscribe({
      next: (task) => {
        this._tasks.update((tasks) => [...tasks, task]);
        this._loading.set(false);
        this.toast.show('Task created successfully', 'success');
      },
      error: (err: Error) => {
        this._error.set(err.message ?? 'Failed to create task');
        this._loading.set(false);
        this.toast.show(err.message ?? 'Failed to create task', 'error');
      },
    });
  }

  updateTask(id: string, dto: UpdateTaskDto): void {
    this._loading.set(true);
    this._error.set(null);
    this.api.update(id, dto).subscribe({
      next: (updated) => {
        this._tasks.update((tasks) => tasks.map((t) => (t.id === id ? updated : t)));
        this._loading.set(false);
        this.toast.show('Task updated successfully', 'success');
      },
      error: (err: Error) => {
        this._error.set(err.message ?? 'Failed to update task');
        this._loading.set(false);
        this.toast.show(err.message ?? 'Failed to update task', 'error');
      },
    });
  }

  deleteTask(id: string): void {
    this._loading.set(true);
    this._error.set(null);
    this.api.delete(id).subscribe({
      next: () => {
        this._tasks.update((tasks) => tasks.filter((t) => t.id !== id));
        this._loading.set(false);
        this.toast.show('Task deleted', 'success');
      },
      error: (err: Error) => {
        this._error.set(err.message ?? 'Failed to delete task');
        this._loading.set(false);
        this.toast.show(err.message ?? 'Failed to delete task', 'error');
      },
    });
  }

  setFilter(partial: Partial<TaskFilter>): void {
    this._filter.update((f) => ({ ...f, ...partial }));
  }

  clearError(): void {
    this._error.set(null);
  }
}
