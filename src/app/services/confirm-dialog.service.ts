import { Injectable, signal } from '@angular/core';

export interface DialogConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private _config = signal<DialogConfig | null>(null);
  private _resolver: ((value: boolean) => void) | null = null;

  readonly config = this._config.asReadonly();

  confirm(config: DialogConfig): Promise<boolean> {
    this._config.set(config);
    return new Promise((resolve) => {
      this._resolver = resolve;
    });
  }

  accept(): void {
    this._config.set(null);
    this._resolver?.(true);
    this._resolver = null;
  }

  cancel(): void {
    this._config.set(null);
    this._resolver?.(false);
    this._resolver = null;
  }
}
