# TaskPulse — Personal Task & Time-Allocation App
### Architecture & Build Instructions for Coding Agents

---

## 0. Read This First (Agent Instructions)

You are building a **personal task and time-allocation web app**. The user creates a task, assigns it a duration, starts it, and the app counts down. If they don't mark it done before time runs out, they get a notification.

Build this in **phases, in order**. Do not skip ahead to notifications before the core task/timer engine works. Do not introduce a backend, database server, or auth system — **this is a local-first, single-user, client-side app.** No login screen. No cloud sync unless explicitly asked later.

Most importantly: **this must not look like a default AI-generated scaffold.** No generic purple-to-blue gradient hero, no default shadcn card grid with no personality, no emoji used as the primary visual language (emoji in this spec are for *communicating intent to you*, not for you to paste into the UI as icons). Section 6 has hard rules on this — read it before writing any component.

---

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React + TypeScript + Vite | Fast dev loop, strong typing for task state machine |
| Styling | Tailwind CSS, but with a **custom design token layer** (see §6) | Utility speed without the generic Tailwind-default look |
| State | Zustand | Simple, no boilerplate, easy to persist |
| Persistence | IndexedDB via `idb` (fallback: localStorage) | Survives refresh; timers need to be reconstructed from stored timestamps, not stored countdown values |
| Background timing | `setInterval` in a **Web Worker**, not the main thread | Prevents drift/throttling when tab is backgrounded |
| Notifications | Web `Notification` API + `Service Worker` | Lets a notification fire even if the tab is backgrounded/minimized |
| Sound (optional) | Small `.mp3`/`.wav` chime via `<audio>` | Notification API alone is silent on some OS/browser combos |
| Build/deploy target | Static site (Vercel/Netlify) or run fully local | No backend needed for MVP |

**Do not** reach for Next.js, a database, or an API server unless the user later asks for multi-device sync. Keep this simple.

---

## 2. Core Concept: Timers Must Survive Reality, Not Just `setInterval`

This is the single most important engineering rule in this project:

> **Never store "time remaining" as a countdown number that decrements every second.** Store the task's `startedAt` timestamp and `durationMs`. Compute `remaining = (startedAt + durationMs) - Date.now()` every tick.

Why: if you store a decrementing counter, it breaks the moment the tab is backgrounded, the laptop sleeps, or the user switches apps — `setInterval` throttles or pauses, and the countdown desyncs from real time. Deriving remaining time from real timestamps means the app is always correct, even if it "missed" ticks while inactive.

This also means: **the "time's up" check must be based on `Date.now() >= startedAt + durationMs`**, checked whenever the app becomes visible again (via the `visibilitychange` event) — not purely relying on an interval firing at exactly the right moment.

---

## 3. Data Model

```typescript
type TaskStatus = "pending" | "in_progress" | "completed" | "expired";

interface Task {
  id: string;              // uuid
  title: string;
  durationMs: number;      // e.g. 2 * 60 * 60 * 1000
  createdAt: number;       // epoch ms
  scheduledStart?: number; // optional epoch ms, if user pre-schedules a start time
  startedAt?: number;      // epoch ms, set when task actually starts
  completedAt?: number;    // epoch ms, set when marked done
  status: TaskStatus;
  notifiedExpired: boolean; // prevents duplicate notifications
}
```

State machine (enforce this strictly — no illegal transitions):

```
pending ──(Start)──► in_progress ──(Done)────► completed
                          │
                          └──(time runs out, not done)──► expired

expired ──(Done, late)──► completed   // allow marking done even after expiry
```

---

## 4. Feature Breakdown (Build in This Order)

### Phase 1 — Task CRUD + list view
- Create task: title + duration (presets: 15m/30m/1h/2h + custom input).
- Optional scheduled start time (date/time picker) — if set, task stays "pending" until that time, otherwise "Start" is manual.
- Edit/delete tasks that haven't started yet.
- List view grouped by status (see §6 for how this should look — not a plain table).

### Phase 2 — Timer engine
- On "Start": set `startedAt = Date.now()`, status → `in_progress`.
- Countdown display computed from `startedAt + durationMs - Date.now()`, updated every second via the Web Worker tick.
- "Mark as Done" available any time while `in_progress` or `expired`.
- Persist every state change to IndexedDB immediately (don't batch — a crash/refresh mid-task must not lose progress).

### Phase 3 — Expiry detection + in-app alert
- When `remaining <= 0` and status is still `in_progress`: flip status → `expired`, show a full-attention in-app state (not just a subtle badge — see §6).
- Must also catch this correctly on load/visibility-change, in case the tab was closed/backgrounded when time ran out.

### Phase 4 — Device notifications
- Request `Notification.permission` the first time the user starts a task (not on page load — ask in context, with a one-line explanation of why).
- Register a Service Worker. When a task expires, if the tab is hidden or the permission is granted, fire a system notification:
  - Title: `Time's up`
  - Body: `"{{task title}}" — your {{duration}} block has ended.`
  - Clicking the notification focuses/opens the app and scrolls to that task.
- If `Notification.permission` is denied, fall back gracefully: in-app banner + optional audio chime. Never let the feature silently fail with no fallback.
- **Be upfront about the real limitation**: browser notifications generally only fire reliably while the browser process is running (even if minimized). If the browser is fully closed, true delivery requires Web Push + a backend push service (see §7, optional stretch phase). Don't over-promise this in the UI copy.

### Phase 5 — Polish
- Empty states, loading states, keyboard shortcuts (e.g. `N` for new task), subtle sound toggle, dark/light mode.

---

## 5. Suggested Folder Structure

```
src/
  components/
    TaskForm/
    TaskCard/
    TaskList/
    CountdownRing/        // the visual timer, not just text
    NotificationPermissionPrompt/
    ExpiredTaskBanner/
  hooks/
    useTaskTimer.ts        // wraps the worker tick + derived remaining time
    useNotifications.ts
  store/
    taskStore.ts           // zustand store
  workers/
    timerWorker.ts
  services/
    db.ts                  // IndexedDB wrapper
    notificationService.ts
  lib/
    time.ts                 // formatting, duration math
  styles/
    tokens.css              // design tokens, see §6
  App.tsx
  main.tsx
public/
  service-worker.js
```

---

## 6. UI/UX — Do Not Make This Look AI-Generated

This is a countdown/productivity app the user will look at dozens of times a day. It needs a **distinct visual identity**, not default component-library aesthetics. Follow these rules exactly:

**Avoid, categorically:**
- Purple/blue gradient backgrounds or buttons (the single most common "AI app" tell).
- Generic rounded white cards with soft drop-shadows and no other personality.
- Emoji used as functional icons in the live UI (🟢⏳✅🔔 are fine in *this document* for communicating with you, not as the icon system in the shipped product — use a proper icon set instead, e.g. Lucide, sized and weighted consistently).
- Inter/system-ui as the only typeface with no attempt at a type personality.
- Centered single-column "hero + 3 feature cards" layouts — this is a tool, not a landing page.

**Do instead:**
- **Pick one real design direction and commit**: e.g. a dense, mono-spaced "command console" aesthetic (dark background, monospace numerals for the countdown, sharp corners, thin 1px borders) — this suits a time-tracking tool well and reads as intentional, not templated. Alternative direction: warm paper/editorial (off-white background, a serif or humanist display font for task titles, understated color only for status, generous whitespace). Pick one, don't blend both.
- Use **tabular/monospace numerals** (`font-variant-numeric: tabular-nums`) for the countdown so digits don't jitter as they change.
- Give the countdown a **real visual timer**, not just text — e.g. a circular progress ring (`CountdownRing` component, SVG `stroke-dashoffset` driven by remaining/duration ratio) that visibly drains. This is the single highest-impact "doesn't look templated" investment in the whole app.
- Color should mean something and be used sparingly: one accent color for "in progress," a distinct (not just "red-500") color for "expired," a muted neutral for "pending" and "completed." Define these once as CSS custom properties in `tokens.css`, never hardcode hex values inline in components.
- Motion: small, purposeful transitions only — a task card shouldn't fade/slide in with a generic Framer Motion default. A subtle scale+opacity on state change, a smooth ring-drain animation, that's it.
- The "Time's Up" state should feel distinct and attention-grabbing without being a garish red alert box — e.g. an inverted color card (light-on-dark or accent-filled), not a bootstrap-style `alert-danger`.
- Empty state (no tasks yet) should have actual copy and a real illustration or icon treatment, not a placeholder gray box.

Concretely, set up `tokens.css` early with a real palette (not Tailwind defaults renamed) and font pairing before building components, so every component pulls from it — this is what prevents visual drift into "generic AI app" territory as more screens get built.

---

## 7. Optional Stretch Phase — True Background Push

Only build this if explicitly requested later. Requires:
- A minimal backend (or serverless function) to hold Web Push subscriptions.
- `web-push` library + VAPID keys.
- Client subscribes via `PushManager`, sends subscription to backend.
- Backend needs a scheduler (cron / queue) to fire the push at the exact expiry timestamp — since the client can't be trusted to be open to trigger its own "future" notification.

This adds real infrastructure (a server, a job scheduler) that the MVP does not need. Flag this to the user as a distinct, optional phase rather than building it by default.

---

## 8. Edge Cases to Handle Explicitly

- User starts a task, closes the laptop lid, opens it 3 hours later — status must correctly show `expired`, not still counting down or stuck.
- Two tasks with overlapping time windows — allowed (no conflict blocking), but consider a visual warning.
- User marks a task "Done" after it already expired — allowed, moves to `completed`, notification must not still show as pending.
- Browser notification permission denied — app must still function, with an in-app fallback and a way to re-prompt later from settings.
- Duration edited — only allowed while status is `pending`.
- Multiple tasks expiring at once — batch or clearly stack notifications, don't let one silently overwrite another.

---

## 9. Definition of Done for MVP

- [ ] Create/edit/delete tasks with duration
- [ ] Start → live countdown (ring + tabular numerals) → Done / Expired
- [ ] Timestamp-based timer survives refresh, sleep, and backgrounding
- [ ] System notification fires on expiry, with graceful permission-denied fallback
- [ ] Custom design system in place (`tokens.css`), no default component-library look
- [ ] Data persists locally across sessions (IndexedDB)
