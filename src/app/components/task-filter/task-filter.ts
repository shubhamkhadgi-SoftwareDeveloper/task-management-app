import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { TaskStateService } from '../../services/task-state.service';
import { TaskStatus, TaskPriority } from '../../models/task.model';

@Component({
  selector: 'app-task-filter',
  templateUrl: './task-filter.html',
  styleUrl: './task-filter.css',
})
export class TaskFilter implements OnInit {
  private state = inject(TaskStateService);
  private destroyRef = inject(DestroyRef);

  readonly filter = this.state.filter;

  private searchSubject = new Subject<string>();

  readonly statuses: Array<{ value: TaskStatus | 'all'; label: string }> = [
    { value: 'all', label: 'All statuses' },
    { value: 'todo', label: 'To Do' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  readonly priorities: Array<{ value: TaskPriority | 'all'; label: string }> = [
    { value: 'all', label: 'All priorities' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((search) => this.state.setFilter({ search }));
  }

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  onStatusChange(status: TaskStatus | 'all'): void {
    this.state.setFilter({ status });
  }

  onPriorityChange(priority: TaskPriority | 'all'): void {
    this.state.setFilter({ priority });
  }

  reset(): void {
    this.state.setFilter({ search: '', status: 'all', priority: 'all' });
    this.searchSubject.next('');
  }

  get hasActiveFilters(): boolean {
    const f = this.filter();
    return !!(f.search || f.status !== 'all' || f.priority !== 'all');
  }
}
