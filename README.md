# Task Management Application

A task management SPA built with **Angular 20**, **TypeScript**, **Reactive Forms**, and **Angular Signals**. Users can create, view, filter, edit, and delete tasks with a real-time dashboard summary and full loading/error/success feedback.

---

## Quick Start

> **Prerequisites:** Node.js 20+ and npm 10+

```bash
npm install
npm start        # dev server at http://localhost:4200
npm test         # Karma/Jasmine unit tests
npm run build    # production build → dist/
```

---

## Routes

| Path | Description |
|---|---|
| `/` | Redirects to `/tasks` |
| `/tasks` | Task list with dashboard, search, and filters |
| `/tasks/new` | Create a new task |
| `/tasks/:id/edit` | Edit an existing task |
| `/404` | Not-found page |
| `/**` | Redirects to `/404` |

---

## Architecture

### Folder structure

```
src/app/
├── models/
│   └── task.model.ts           — Task interface, DTOs, TaskFilter, TaskStats
├── services/
│   ├── task-api.service.ts     — Mock API (in-memory Map + RxJS delay)
│   ├── task-state.service.ts   — Signals state store (single source of truth)
│   ├── toast.service.ts        — Global toast notifications
│   └── confirm-dialog.service.ts — Promise-based confirmation dialog
└── components/
    ├── task-list/              — Page: dashboard summary + filter + card grid
    ├── task-card/              — Displays one task; owns delete confirmation flow
    ├── task-filter/            — Debounced search + status/priority dropdowns
    ├── task-form/              — Reactive Form for create & edit (shared)
    ├── confirm-dialog/         — Modal overlay rendered in the app shell
    ├── toast/                  — Stacked notifications rendered in the app shell
    └── not-found/              — 404 page
```

### Data flow

```
TaskApiService          (pure RxJS, no state)
      ↓  Observable<Task>
TaskStateService        (owns all state via Signals; consumes TaskApiService)
      ↓  readonly Signals + computed()
Components              (read Signals; call service methods; never touch HttpClient)
      ↓  outputs / router.navigate
TaskStateService.mutate → TaskApiService.mutate → update Signal in-place
```

---

## README Questions

### 1. Why Angular Signals for state management?

The project runs **zoneless change detection** (`provideZonelessChangeDetection()`), which means Zone.js is absent and the framework only schedules re-renders when a Signal value changes. Signals are the natural fit here:

- `signal<Task[]>([])` is the single source of truth; mutations are always immutable (`update(tasks => [...tasks, newTask])`).
- `computed()` derives `filteredTasks` and `taskStats` lazily and automatically — no manual subscriptions or `distinctUntilChanged` chains needed.
- Compared with NgRx (more boilerplate) or a plain BehaviorSubject approach (no template-level reactivity), Signals deliver the same guarantees with less ceremony in an Angular 20 project.

RxJS is still used where it adds value: `TaskApiService` returns cold `Observable`s (composable, cancellable, delay-able) and `TaskFilter` uses a `Subject + debounceTime(300)` for debounced search — both are cleaner with RxJS than with Signals alone.

### 2. How is data passed between layers?

| Layer | Contract |
|---|---|
| **TaskApiService** | Returns `Observable<T>` for every CRUD operation. It is stateless — it holds an in-memory `Map` acting as a database but exposes no Signals. |
| **TaskStateService** | Subscribes to Observables from the API inside each mutation method. On `next`, it writes to private `signal()` instances and calls `ToastService`. On `error`, it sets the `error` signal and shows an error toast. Exposes only `asReadonly()` signals and `computed()` values to consumers. |
| **Components** | Inject `TaskStateService` and read its readonly signals in the template (`tasks()`, `loading()`, `stats()`). They call service methods (`createTask`, `deleteTask`, etc.) but never handle raw Observables themselves, keeping subscription management in one place. |

### 3. Technical trade-offs made because of the time limit

| Trade-off | What was skipped | Impact |
|---|---|---|
| Navigation after save happens before the API response | `router.navigate(['/tasks'])` is called immediately after dispatching `createTask`/`updateTask` rather than waiting for the Observable to resolve | If the save fails the user lands on the list with an error toast — functional but not ideal UX |
| No optimistic updates | State is mutated only after the mock API resolves | Adds 400 ms perceived latency; acceptable for a mock API |
| No pagination | All tasks are rendered at once | Would not scale to thousands of real tasks (addressed in Q5) |
| No E2E tests | Only unit tests written | Integration and user-journey coverage is absent |
| Form does not block navigation on unsaved changes | No `CanDeactivate` guard | Users can lose edits via the browser back button |
| In-memory store resets on page refresh | No `localStorage` persistence | Expected for a mock data source; noted here for clarity |

### 4. What would you improve before deploying to production?

1. **Replace the mock API with `HttpClient`** behind a proper backend; add `HttpInterceptor` for auth headers and centralised error normalisation.
2. **Wait for the API response before navigating** — use `switchMap` in the component or an effect tied to a success signal so the user never lands on a stale list.
3. **`CanDeactivate` guard on `TaskForm`** to warn before discarding unsaved changes.
4. **`localStorage` / `IndexedDB` caching** with a service worker for offline read access.
5. **Pagination or virtual scrolling** (`@angular/cdk/scrolling`) for large datasets.
6. **`aria-live` announcements** for all mutations so screen-reader users receive feedback without relying solely on colour.
7. **Authentication** — route guards, token refresh, redirect to login on 401.
8. **CI pipeline** — lint, build, test, coverage threshold gate on every PR.
9. **Error boundary / global `ErrorHandler`** to catch uncaught promise rejections and report to a monitoring service (Sentry, Datadog).
10. **Content-Security-Policy headers** and a security audit (dependency scanning, OWASP review).

### 5. How would you support thousands of tasks efficiently?

| Problem | Solution |
|---|---|
| **Network** | Server-side pagination (`GET /tasks?page=1&limit=50`); cursor-based paging for real-time feeds. Never fetch the full list. |
| **Rendering** | `@angular/cdk/scrolling` virtual scroll — only DOM nodes in the viewport are rendered. |
| **Filtering & search** | Move filtering to the API (`GET /tasks?status=todo&q=deploy`); keep the client-side computed filter only for instant feedback on a cached page. |
| **State** | For thousands of tasks the flat `signal<Task[]>` becomes a bottleneck on every mutation (the entire array is replaced). Replace it with a `signal<Map<string, Task>>` so individual updates are O(1); `computed()` over the Map still gives derived lists. |
| **Search latency** | Full-text search belongs in the backend (Postgres `tsvector`, Elasticsearch, or Typesense) rather than a client-side `.includes()`. |
| **Real-time updates** | WebSocket / Server-Sent Events to push task changes from other users without polling. |

---

## Completed Requirements

| # | Requirement | Status |
|---|---|---|
| 1 | Task list — cards/table with all tasks | ✅ |
| 2 | Search by title (debounced, 300 ms) | ✅ |
| 3 | Filter by status | ✅ |
| 4 | Filter by priority | ✅ |
| 5 | Overdue badge on past-due incomplete tasks | ✅ |
| 6 | Empty state when no tasks match | ✅ |
| 7 | Create task with Reactive Form | ✅ |
| 8 | Edit task — same form reused, pre-populated | ✅ |
| 9 | Validation: title required, min 3 chars | ✅ |
| 10 | Validation: status, priority, due date required | ✅ |
| 11 | Clear inline validation messages | ✅ |
| 12 | Delete task with confirmation dialog | ✅ |
| 13 | Dashboard summary (total / completed / in-progress / overdue) | ✅ |
| 14 | Dashboard updates reactively via `computed()` | ✅ |
| 15 | Routes: `/tasks`, `/tasks/new`, `/tasks/:id/edit` | ✅ |
| 16 | Default redirect `/` → `/tasks` | ✅ |
| 17 | 404 not-found page + wildcard redirect | ✅ |
| 18 | Mock API service (get, create, update, delete) | ✅ |
| 19 | Components never call the API directly | ✅ |
| 20 | Single source of truth via `TaskStateService` | ✅ |
| 21 | Immutable signal updates | ✅ |
| 22 | Derived state (`filteredTasks`, `taskStats`) via `computed()` | ✅ |
| 23 | Loading indicator (skeleton shimmer) during fetch | ✅ |
| 24 | Error state with dismissable alert | ✅ |
| 25 | Success toast on create / update / delete | ✅ |
| 26 | Lazy-loaded routes | ✅ |
| 27 | Standalone components, zoneless CD | ✅ |
| 28 | Service tests (state, API) | ✅ |
| 29 | Component test (TaskForm) with form validation | ✅ |
| 30 | API error-handling tests | ✅ |

## Incomplete / Out-of-Scope Items

| Item | Notes |
|---|---|
| Navigation waits for API response | Router navigates immediately; a failed save shows a toast on the list page instead of keeping the form open |
| `CanDeactivate` guard | No unsaved-changes warning when leaving the form |
| E2E tests | Unit tests only; no Cypress/Playwright suite |
| Pagination / virtual scroll | All matching tasks render at once |
| Backend persistence | In-memory mock only; data resets on page refresh |
| Responsive mobile layout | Basic responsive grid; not fully optimised for small screens |

---

## Assumptions

- `dueDate` is stored and compared as an ISO `YYYY-MM-DD` string; no timezone conversion is applied.
- `description` is optional (`description?: string`) matching the assignment interface exactly.
- Overdue means `dueDate < today (local date)` AND `status !== 'completed'`.
- The mock API simulates 400 ms latency on every operation to make loading states visible.
- No authentication is required.

---

## Candidate Declaration

This application was built with the assistance of **Claude Code (Anthropic)**, an AI coding assistant. All code was generated, reviewed, and verified within this session. The candidate is prepared to walk through, explain, and modify any part of the codebase during the follow-up technical discussion.
