import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'tasks', pathMatch: 'full' },
  {
    path: 'tasks',
    loadComponent: () => import('./components/task-list/task-list').then((m) => m.TaskList),
  },
  {
    path: 'tasks/new',
    loadComponent: () => import('./components/task-form/task-form').then((m) => m.TaskForm),
  },
  {
    path: 'tasks/:id/edit',
    loadComponent: () => import('./components/task-form/task-form').then((m) => m.TaskForm),
  },
  {
    path: '404',
    loadComponent: () => import('./components/not-found/not-found').then((m) => m.NotFound),
  },
  { path: '**', redirectTo: '404' },
];
