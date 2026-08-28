import { useState } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { getUserId } from '../../services/notificationService';
import { X, Minus, Plus, Play } from 'lucide-react';

export function AddTaskModal() {
  const { isAddTaskOpen, setAddTaskOpen, addTask, setActiveTab, tasks } = useTaskStore();

  const [title, setTitle] = useState('');
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [startTime, setStartTime] = useState('');

  // Editing state for direct typed input
  const [editingHours, setEditingHours] = useState(false);
  const [editingMinutes, setEditingMinutes] = useState(false);
  const [editingSeconds, setEditingSeconds] = useState(false);
  const [hoursRaw, setHoursRaw] = useState('');
  const [minutesRaw, setMinutesRaw] = useState('');
  const [secondsRaw, setSecondsRaw] = useState('');


  if (!isAddTaskOpen) return null;

  // Hours: 0–23, Minutes: 0–59 — 1-unit steps, no 15-min restriction
  const changeHours = (delta: number) => {
    setHours((h) => Math.min(23, Math.max(0, h + delta)));
  };

  const changeMinutes = (delta: number) => {
    setMinutes((m) => {
      const next = m + delta;
      if (next >= 60) {
        setHours((h) => Math.min(23, h + 1));
        return next - 60;
      }
      if (next < 0) {
        if (hours > 0) {
          setHours((h) => h - 1);
          return 60 + next;
        }
        return 0;
      }
      return next;
    });
  };

  const commitHours = () => {
    const val = parseInt(hoursRaw, 10);
    if (!isNaN(val)) setHours(Math.min(23, Math.max(0, val)));
    setEditingHours(false);
  };

  const commitMinutes = () => {
    const val = parseInt(minutesRaw, 10);
    if (!isNaN(val)) setMinutes(Math.min(59, Math.max(0, val)));
    setEditingMinutes(false);
  };

  const changeSeconds = (delta: number) => {
    setSeconds((s) => {
      const next = s + delta;
      if (next >= 60) {
        setMinutes((m) => {
          if (m + 1 >= 60) { setHours((h) => Math.min(23, h + 1)); return 0; }
          return m + 1;
        });
        return next - 60;
      }
      if (next < 0) {
        setMinutes((m) => {
          if (m > 0) return m - 1;
          if (hours > 0) { setHours((h) => h - 1); return 59; }
          return 0;
        });
        return next < 0 && (minutes > 0 || hours > 0) ? 60 + next : 0;
      }
      return next;
    });
  };

  const commitSeconds = () => {
    const val = parseInt(secondsRaw, 10);
    if (!isNaN(val)) setSeconds(Math.min(59, Math.max(0, val)));
    setEditingSeconds(false);
  };

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  const handleSubmit = (startImmediately: boolean) => {
    if (!title.trim() || totalSeconds <= 0) return;

    const totalDurationMs = totalSeconds * 1000;
    let scheduledTime: number | undefined;
    if (startTime) {
      const parsedTime = new Date(startTime).getTime();
      if (!isNaN(parsedTime)) scheduledTime = parsedTime;
    }

    const now = Date.now();

    // If there's already an active task running, always queue the new task
    // instead of displacing the current one.
    const hasActiveTask = tasks.some(
      (t) => t.status === 'in_progress' || t.status === 'expired'
    );
    
    // If an active task exists, ALWAYS queue the new task regardless of button clicked
    const shouldStartNow = !hasActiveTask && startImmediately;

    addTask({
      id: crypto.randomUUID(),
      userId: getUserId(),
      title: title.trim(),
      durationMs: totalDurationMs,
      createdAt: now,
      scheduledStart: scheduledTime,
      startedAt: shouldStartNow ? now : undefined,
      endTime: shouldStartNow ? now + totalDurationMs : undefined,
      status: shouldStartNow ? 'in_progress' : 'pending',
      notifiedExpired: false,
    });

    setTitle('');
    setHours(1);
    setMinutes(0);
    setSeconds(0);
    setStartTime('');
    setAddTaskOpen(false);
    
    // Navigate to timer if we started a task, otherwise go to tasks to see the queue
    if (shouldStartNow) {
      setActiveTab('timer');
    } else {
      setActiveTab('tasks');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[var(--surface)] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 border border-[var(--surface-border)] shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--surface-border)] pb-4">
          <h3 className="text-lg font-bold text-white">New Task</h3>
          <button
            onClick={() => setAddTaskOpen(false)}
            className="p-1.5 rounded-full bg-[var(--surface-sunken)] text-[var(--ink-secondary)] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Task Title */}
        <div className="flex flex-col gap-2">
          <label htmlFor="task-title-input" className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
            Task Name
          </label>
          <input
            id="task-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Work on project proposal"
            className="bg-[var(--surface-sunken)] border border-[var(--surface-border)] rounded-xl px-4 py-3.5 text-base text-white placeholder-[var(--ink-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            autoFocus
          />
        </div>

        {/* Duration Stepper */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
              Duration
            </label>
            {totalSeconds > 0 && (
              <span className="text-xs text-[var(--accent)] font-medium">
                {hours > 0 ? `${hours}h ` : ''}{minutes > 0 ? `${minutes}m ` : ''}{seconds > 0 ? `${seconds}s` : ''}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Hours Stepper */}
            <div className="bg-[var(--surface-sunken)] border border-[var(--surface-border)] rounded-2xl p-3 flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase font-semibold text-[var(--ink-secondary)]">Hours</span>
              <div className="flex items-center justify-between w-full">
                <button type="button" onClick={() => changeHours(-1)}
                  className="w-9 h-9 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-border)] text-white flex items-center justify-center transition-colors active:scale-95">
                  <Minus size={16} />
                </button>

                {editingHours ? (
                  <input
                    type="number" min={0} max={23}
                    value={hoursRaw}
                    onChange={(e) => setHoursRaw(e.target.value)}
                    onBlur={commitHours}
                    onKeyDown={(e) => e.key === 'Enter' && commitHours()}
                    className="font-mono text-2xl font-bold text-[var(--accent)] bg-transparent text-center w-12 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <button type="button"
                    onClick={() => { setHoursRaw(hours.toString()); setEditingHours(true); }}
                    className="font-mono text-2xl font-bold text-white hover:text-[var(--accent)] transition-colors w-12 text-center"
                    title="Tap to type">
                    {hours.toString().padStart(2, '0')}
                  </button>
                )}

                <button type="button" onClick={() => changeHours(1)}
                  className="w-9 h-9 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-border)] text-white flex items-center justify-center transition-colors active:scale-95">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Minutes Stepper */}
            <div className="bg-[var(--surface-sunken)] border border-[var(--surface-border)] rounded-2xl p-3 flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase font-semibold text-[var(--ink-secondary)]">Minutes</span>
              <div className="flex items-center justify-between w-full">
                <button type="button" onClick={() => changeMinutes(-1)}
                  className="w-9 h-9 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-border)] text-white flex items-center justify-center transition-colors active:scale-95">
                  <Minus size={16} />
                </button>

                {editingMinutes ? (
                  <input
                    type="number" min={0} max={59}
                    value={minutesRaw}
                    onChange={(e) => setMinutesRaw(e.target.value)}
                    onBlur={commitMinutes}
                    onKeyDown={(e) => e.key === 'Enter' && commitMinutes()}
                    className="font-mono text-2xl font-bold text-[var(--accent)] bg-transparent text-center w-12 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <button type="button"
                    onClick={() => { setMinutesRaw(minutes.toString()); setEditingMinutes(true); }}
                    className="font-mono text-2xl font-bold text-white hover:text-[var(--accent)] transition-colors w-12 text-center"
                    title="Tap to type">
                    {minutes.toString().padStart(2, '0')}
                  </button>
                )}

                <button type="button" onClick={() => changeMinutes(1)}
                  className="w-9 h-9 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-border)] text-white flex items-center justify-center transition-colors active:scale-95">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Seconds Stepper */}
            <div className="bg-[var(--surface-sunken)] border border-[var(--surface-border)] rounded-2xl p-3 flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase font-semibold text-[var(--ink-secondary)]">Seconds</span>
              <div className="flex items-center justify-between w-full">
                <button type="button" onClick={() => changeSeconds(-1)}
                  className="w-9 h-9 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-border)] text-white flex items-center justify-center transition-colors active:scale-95">
                  <Minus size={16} />
                </button>

                {editingSeconds ? (
                  <input
                    type="number" min={0} max={59}
                    value={secondsRaw}
                    onChange={(e) => setSecondsRaw(e.target.value)}
                    onBlur={commitSeconds}
                    onKeyDown={(e) => e.key === 'Enter' && commitSeconds()}
                    className="font-mono text-2xl font-bold text-[var(--accent)] bg-transparent text-center w-12 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <button type="button"
                    onClick={() => { setSecondsRaw(seconds.toString()); setEditingSeconds(true); }}
                    className="font-mono text-2xl font-bold text-white hover:text-[var(--accent)] transition-colors w-12 text-center"
                    title="Tap to type">
                    {seconds.toString().padStart(2, '0')}
                  </button>
                )}

                <button type="button" onClick={() => changeSeconds(1)}
                  className="w-9 h-9 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-border)] text-white flex items-center justify-center transition-colors active:scale-95">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: '30s', secs: 30 },
              { label: '1m', secs: 60 },
              { label: '5m', secs: 300 },
              { label: '10m', secs: 600 },
              { label: '15m', secs: 900 },
              { label: '30m', secs: 1800 },
              { label: '45m', secs: 2700 },
              { label: '1h', secs: 3600 },
              { label: '2h', secs: 7200 },
            ].map(({ label, secs }) => (
              <button
                key={secs}
                type="button"
                onClick={() => {
                  setHours(Math.floor(secs / 3600));
                  setMinutes(Math.floor((secs % 3600) / 60));
                  setSeconds(secs % 60);
                }}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                  totalSeconds === secs
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                    : 'bg-[var(--surface-sunken)] border-[var(--surface-border)] text-[var(--ink-secondary)] hover:text-white hover:border-[var(--accent)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Start Time Optional */}
        <div className="flex flex-col gap-2">
          <label htmlFor="modal-start-time" className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
            Start Time <span className="normal-case text-[var(--ink-tertiary)] font-normal">(optional)</span>
          </label>
          <input
            id="modal-start-time"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="bg-[var(--surface-sunken)] border border-[var(--surface-border)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={totalSeconds <= 0 || !title.trim()}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-strong)] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-full text-base shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-2"
          >
            <Play size={18} className="fill-current" />
            {tasks.some((t) => t.status === 'in_progress' || t.status === 'expired')
              ? 'Add to Queue'
              : 'Start Timer'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={totalSeconds <= 0 || !title.trim()}
            className="w-full bg-transparent hover:bg-[var(--surface-sunken)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--ink-secondary)] font-medium py-3 rounded-full text-sm transition-colors"
          >
            Save to Queue
          </button>
        </div>
      </div>
    </div>
  );
}
