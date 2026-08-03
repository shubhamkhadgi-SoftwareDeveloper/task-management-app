import { Component, inject, input, output } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Task } from '../../models/task.model';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-task-card',
  imports: [RouterLink, TitleCasePipe],
  templateUrl: './task-card.html',
  styleUrl: './task-card.css',
})
export class TaskCard {
  private confirmDialog = inject(ConfirmDialogService);

  task = input.required<Task>();
  deleteConfirmed = output<string>();

  get isOverdue(): boolean {
    const task = this.task();
    if (task.status === 'completed') return false;
    const today = new Date().toISOString().split('T')[0];
    return task.dueDate < today;
  }

  async onDeleteClick(event: Event): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Task',
      message: `Are you sure you want to delete "${this.task().title}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (confirmed) {
      this.deleteConfirmed.emit(this.task().id);
    }
  }
}
