import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TaskStateService } from './task-state.service';
import { TaskApiService } from './task-api.service';
import { ToastService } from './toast.service';
import { Task, CreateTaskDto } from '../models/task.model';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

const MOCK_TASK: Task = {
  id: '1',
  title: 'Test Task',
  description: 'A description',
  status: 'todo',
  priority: 'medium',
  dueDate: '2099-12-31',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('TaskStateService', () => {
  let service: TaskStateService;
  let apiSpy: jasmine.SpyObj<TaskApiService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj<TaskApiService>('TaskApiService', [
      'getAll',
      'getById',
      'create',
      'update',
      'delete',
    ]);
    toastSpy = jasmine.createSpyObj<ToastService>('ToastService', ['show', 'dismiss']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TaskStateService,
        { provide: TaskApiService, useValue: apiSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    });
    service = TestBed.inject(TaskStateService);
  });

  it('should start with empty state', () => {
    expect(service.tasks()).toEqual([]);
    expect(service.loading()).toBeFalse();
    expect(service.error()).toBeNull();
  });

  describe('loadTasks()', () => {
    it('sets loading true during fetch and false on success', fakeAsync(() => {
      apiSpy.getAll.and.returnValue(of([MOCK_TASK]).pipe(delay(100)));

      service.loadTasks();
      expect(service.loading()).toBeTrue();

      tick(100);
      expect(service.loading()).toBeFalse();
      expect(service.tasks()).toEqual([MOCK_TASK]);
    }));

    it('sets error and clears loading when the API fails', fakeAsync(() => {
      apiSpy.getAll.and.returnValue(
        throwError(() => new Error('Network error')).pipe(delay(100)),
      );

      service.loadTasks();
      tick(100);

      expect(service.loading()).toBeFalse();
      expect(service.error()).toBe('Network error');
      expect(service.tasks()).toEqual([]);
    }));
  });

  describe('createTask()', () => {
    it('appends the new task to the list', fakeAsync(() => {
      apiSpy.getAll.and.returnValue(of([MOCK_TASK]).pipe(delay(0)));
      service.loadTasks();
      tick(0);

      const dto: CreateTaskDto = {
        title: 'New Task',
        status: 'todo',
        priority: 'high',
        dueDate: '2099-01-01',
      };
      const created: Task = { ...dto, id: '2', createdAt: '', updatedAt: '' };
      apiSpy.create.and.returnValue(of(created).pipe(delay(0)));

      service.createTask(dto);
      tick(0);

      expect(service.tasks().length).toBe(2);
      expect(service.tasks()[1].title).toBe('New Task');
      expect(toastSpy.show).toHaveBeenCalledWith('Task created successfully', 'success');
    }));
  });

  describe('deleteTask()', () => {
    it('removes the task from the list', fakeAsync(() => {
      apiSpy.getAll.and.returnValue(of([MOCK_TASK]).pipe(delay(0)));
      service.loadTasks();
      tick(0);

      apiSpy.delete.and.returnValue(of(undefined).pipe(delay(0)));
      service.deleteTask('1');
      tick(0);

      expect(service.tasks()).toEqual([]);
      expect(toastSpy.show).toHaveBeenCalledWith('Task deleted', 'success');
    }));

    it('sets an error message when delete fails', fakeAsync(() => {
      apiSpy.getAll.and.returnValue(of([MOCK_TASK]).pipe(delay(0)));
      service.loadTasks();
      tick(0);

      apiSpy.delete.and.returnValue(
        throwError(() => new Error('Delete failed')).pipe(delay(0)),
      );
      service.deleteTask('1');
      tick(0);

      expect(service.error()).toBe('Delete failed');
      expect(service.tasks().length).toBe(1);
    }));
  });

  describe('filteredTasks (computed)', () => {
    beforeEach(fakeAsync(() => {
      const tasks: Task[] = [
        { ...MOCK_TASK, id: '1', title: 'Alpha', status: 'todo', priority: 'high' },
        { ...MOCK_TASK, id: '2', title: 'Beta', status: 'in-progress', priority: 'low' },
        { ...MOCK_TASK, id: '3', title: 'Gamma', status: 'completed', priority: 'medium' },
      ];
      apiSpy.getAll.and.returnValue(of(tasks).pipe(delay(0)));
      service.loadTasks();
      tick(0);
    }));

    it('returns all tasks when no filter is applied', () => {
      expect(service.filteredTasks().length).toBe(3);
    });

    it('filters by title search (case-insensitive)', () => {
      service.setFilter({ search: 'alpha' });
      expect(service.filteredTasks().length).toBe(1);
      expect(service.filteredTasks()[0].title).toBe('Alpha');
    });

    it('filters by status', () => {
      service.setFilter({ status: 'completed' });
      expect(service.filteredTasks().length).toBe(1);
      expect(service.filteredTasks()[0].status).toBe('completed');
    });

    it('filters by priority', () => {
      service.setFilter({ priority: 'low' });
      expect(service.filteredTasks().length).toBe(1);
      expect(service.filteredTasks()[0].priority).toBe('low');
    });
  });

  describe('taskStats (computed)', () => {
    it('computes overdue count correctly', fakeAsync(() => {
      const tasks: Task[] = [
        { ...MOCK_TASK, id: '1', status: 'todo', dueDate: '2000-01-01' },
        { ...MOCK_TASK, id: '2', status: 'completed', dueDate: '2000-01-01' },
        { ...MOCK_TASK, id: '3', status: 'in-progress', dueDate: '2099-12-31' },
      ];
      apiSpy.getAll.and.returnValue(of(tasks).pipe(delay(0)));
      service.loadTasks();
      tick(0);

      const stats = service.taskStats();
      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(1);
      expect(stats.inProgress).toBe(1);
      expect(stats.overdue).toBe(1);
    }));
  });
});
