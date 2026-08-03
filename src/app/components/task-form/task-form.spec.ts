import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TaskForm } from './task-form';
import { TaskStateService } from '../../services/task-state.service';
import { TaskApiService } from '../../services/task-api.service';
import { ToastService } from '../../services/toast.service';
import { routes } from '../../app.routes';

describe('TaskForm', () => {
  let fixture: ComponentFixture<TaskForm>;
  let component: TaskForm;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskForm],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        TaskStateService,
        TaskApiService,
        ToastService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('initialises in create mode (not edit mode)', () => {
    expect(component.isEditMode()).toBeFalse();
  });

  it('form is invalid when empty', () => {
    expect(component.form.invalid).toBeTrue();
  });

  describe('title validation', () => {
    it('is required', () => {
      const ctrl = component.form.get('title')!;
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(ctrl.hasError('required')).toBeTrue();
    });

    it('requires at least 3 characters', () => {
      const ctrl = component.form.get('title')!;
      ctrl.setValue('ab');
      ctrl.markAsTouched();
      expect(ctrl.hasError('minlength')).toBeTrue();
    });

    it('rejects titles longer than 100 characters', () => {
      const ctrl = component.form.get('title')!;
      ctrl.setValue('a'.repeat(101));
      ctrl.markAsTouched();
      expect(ctrl.hasError('maxlength')).toBeTrue();
    });

    it('accepts a valid title of 3+ characters', () => {
      const ctrl = component.form.get('title')!;
      ctrl.setValue('Fix login bug');
      expect(ctrl.valid).toBeTrue();
    });
  });

  describe('status validation', () => {
    it('is required', () => {
      const ctrl = component.form.get('status')!;
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(ctrl.hasError('required')).toBeTrue();
    });
  });

  describe('priority validation', () => {
    it('is required', () => {
      const ctrl = component.form.get('priority')!;
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(ctrl.hasError('required')).toBeTrue();
    });
  });

  describe('dueDate validation', () => {
    it('is required', () => {
      const ctrl = component.form.get('dueDate')!;
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(ctrl.hasError('required')).toBeTrue();
    });

    it('accepts a valid ISO date string', () => {
      const ctrl = component.form.get('dueDate')!;
      ctrl.setValue('2099-12-31');
      expect(ctrl.valid).toBeTrue();
    });
  });

  describe('onSubmit()', () => {
    it('marks all controls as touched when the form is invalid', () => {
      component.onSubmit();
      const touchedStates = Object.values(component.form.controls).map((c) => c.touched);
      expect(touchedStates.every(Boolean)).toBeTrue();
    });

    it('does not submit if the title is missing', () => {
      const stateSpy = spyOn(
        TestBed.inject(TaskStateService),
        'createTask',
      );
      component.form.patchValue({ title: '', dueDate: '2099-01-01' });
      component.onSubmit();
      expect(stateSpy).not.toHaveBeenCalled();
    });

    it('calls createTask with the correct DTO on a valid form', fakeAsync(() => {
      const stateSpy = spyOn(TestBed.inject(TaskStateService), 'createTask');
      component.form.patchValue({
        title: 'Deploy to production',
        description: 'Run the deploy script',
        status: 'todo',
        priority: 'high',
        dueDate: '2099-09-01',
      });
      component.onSubmit();
      tick();

      expect(stateSpy).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({
          title: 'Deploy to production',
          status: 'todo',
          priority: 'high',
          dueDate: '2099-09-01',
        }),
      );
    }));
  });

  describe('hasError()', () => {
    it('returns false when a field has not been touched', () => {
      expect(component.hasError('title', 'required')).toBeFalse();
    });

    it('returns true when a touched field has the matching error', () => {
      const ctrl = component.form.get('title')!;
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(component.hasError('title', 'required')).toBeTrue();
    });
  });
});
