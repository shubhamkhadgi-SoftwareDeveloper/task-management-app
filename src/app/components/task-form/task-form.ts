import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TaskStateService } from '../../services/task-state.service';
import { TaskApiService } from '../../services/task-api.service';
import { CreateTaskDto, TaskPriority, TaskStatus } from '../../models/task.model';

@Component({
  selector: 'app-task-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './task-form.html',
  styleUrl: './task-form.css',
})
export class TaskForm implements OnInit {
  private fb = inject(FormBuilder);
  private state = inject(TaskStateService);
  private api = inject(TaskApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly isEditMode = signal(false);
  readonly taskId = signal<string | null>(null);
  readonly loadingTask = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = this.state.loading;

  readonly statuses: Array<{ value: TaskStatus; label: string }> = [
    { value: 'todo', label: 'To Do' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  readonly priorities: Array<{ value: TaskPriority; label: string }> = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    status: ['todo' as TaskStatus, Validators.required],
    priority: ['medium' as TaskPriority, Validators.required],
    dueDate: ['', Validators.required],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.taskId.set(id);
      this.loadTask(id);
    }
  }

  private loadTask(id: string): void {
    this.loadingTask.set(true);
    this.api.getById(id).subscribe({
      next: (task) => {
        this.form.patchValue({
          title: task.title,
          description: task.description ?? '',
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
        });
        this.loadingTask.set(false);
      },
      error: (err: Error) => {
        this.loadError.set(err.message ?? 'Task not found');
        this.loadingTask.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { title, description, status, priority, dueDate } = this.form.getRawValue();
    const dto: CreateTaskDto = {
      title: title!.trim(),
      description: description?.trim() || undefined,
      status: status as TaskStatus,
      priority: priority as TaskPriority,
      dueDate: dueDate!,
    };

    const id = this.taskId();
    if (this.isEditMode() && id) {
      this.state.updateTask(id, dto);
    } else {
      this.state.createTask(dto);
    }
    this.router.navigate(['/tasks']);
  }

  hasError(field: string, error: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.touched && ctrl.hasError(error));
  }
}
