import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TaskStateService } from '../../services/task-state.service';
import { TaskCard } from '../task-card/task-card';
import { TaskFilter } from '../task-filter/task-filter';

@Component({
  selector: 'app-task-list',
  imports: [RouterLink, TaskCard, TaskFilter],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css',
})
export class TaskList implements OnInit {
  private state = inject(TaskStateService);

  readonly tasks = this.state.filteredTasks;
  readonly loading = this.state.loading;
  readonly error = this.state.error;
  readonly stats = this.state.taskStats;

  ngOnInit(): void {
    this.state.loadTasks();
  }

  deleteTask(id: string): void {
    this.state.deleteTask(id);
  }

  dismissError(): void {
    this.state.clearError();
  }
}
