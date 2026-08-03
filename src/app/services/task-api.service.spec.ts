import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TaskApiService } from './task-api.service';
import { CreateTaskDto } from '../models/task.model';

describe('TaskApiService', () => {
  let service: TaskApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), TaskApiService],
    });
    service = TestBed.inject(TaskApiService);
  });

  describe('getAll()', () => {
    it('returns the seeded tasks', fakeAsync(() => {
      let result: unknown;
      service.getAll().subscribe((tasks) => (result = tasks));
      tick(500);
      expect(Array.isArray(result)).toBeTrue();
      expect((result as unknown[]).length).toBeGreaterThan(0);
    }));
  });

  describe('getById()', () => {
    it('returns the task when it exists', fakeAsync(() => {
      let title: string | undefined;
      service.getById('1').subscribe((t) => (title = t.title));
      tick(500);
      expect(title).toBeDefined();
    }));

    it('emits an error for a non-existent id', fakeAsync(() => {
      let errorMessage: string | undefined;
      service.getById('nonexistent').subscribe({
        error: (e: Error) => (errorMessage = e.message),
      });
      tick(500);
      expect(errorMessage).toContain('nonexistent');
    }));
  });

  describe('create()', () => {
    it('returns a task with an auto-generated id', fakeAsync(() => {
      const dto: CreateTaskDto = {
        title: 'Brand new task',
        status: 'todo',
        priority: 'medium',
        dueDate: '2099-01-01',
      };
      let id: string | undefined;
      service.create(dto).subscribe((t) => (id = t.id));
      tick(500);
      expect(id).toBeDefined();
    }));

    it('makes the created task retrievable via getAll', fakeAsync(() => {
      const dto: CreateTaskDto = {
        title: 'Retrievable task',
        status: 'todo',
        priority: 'low',
        dueDate: '2099-06-01',
      };
      service.create(dto).subscribe();
      tick(500);

      let titles: string[] = [];
      service.getAll().subscribe((tasks) => (titles = tasks.map((t) => t.title)));
      tick(500);

      expect(titles).toContain('Retrievable task');
    }));
  });

  describe('update()', () => {
    it('returns the updated task', fakeAsync(() => {
      let updatedTitle: string | undefined;
      service.update('1', { title: 'Updated title' }).subscribe((t) => (updatedTitle = t.title));
      tick(500);
      expect(updatedTitle).toBe('Updated title');
    }));

    it('emits an error when the task does not exist', fakeAsync(() => {
      let errorMessage: string | undefined;
      service.update('99999', { title: 'Ghost' }).subscribe({
        error: (e: Error) => (errorMessage = e.message),
      });
      tick(500);
      expect(errorMessage).toContain('99999');
    }));
  });

  describe('delete()', () => {
    it('removes the task so it no longer appears in getAll', fakeAsync(() => {
      service.delete('1').subscribe();
      tick(500);

      let ids: string[] = [];
      service.getAll().subscribe((tasks) => (ids = tasks.map((t) => t.id)));
      tick(500);

      expect(ids).not.toContain('1');
    }));

    it('emits an error when the task does not exist', fakeAsync(() => {
      let errorMessage: string | undefined;
      service.delete('nonexistent').subscribe({
        error: (e: Error) => (errorMessage = e.message),
      });
      tick(500);
      expect(errorMessage).toContain('nonexistent');
    }));
  });
});
