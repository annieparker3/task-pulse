import { useState } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { Plus } from 'lucide-react';

const PRESETS = [
  { label: '15m', ms: 15 * 60 * 1000 },
  { label: '30m', ms: 30 * 60 * 1000 },
  { label: '1h', ms: 60 * 60 * 1000 },
  { label: '2h', ms: 120 * 60 * 1000 },
];

export function TaskForm() {
  const addTask = useTaskStore((state) => state.addTask);

  const [title, setTitle] = useState('');
  const [durationMs, setDurationMs] = useState(PRESETS[0].ms);
  const [isCustom, setIsCustom] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('45');
  const [scheduledStart, setScheduledStart] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalDuration = isCustom ? parseInt(customMinutes, 10) * 60 * 1000 : durationMs;
    if (isNaN(finalDuration) || finalDuration <= 0) return;

    let scheduledTime: number | undefined = undefined;
    if (scheduledStart) {
      const parsedTime = new Date(scheduledStart).getTime();
      if (!isNaN(parsedTime) && parsedTime > Date.now()) {
        scheduledTime = parsedTime;
      }
    }

    addTask({
      id: crypto.randomUUID(),
      title: title.trim(),
      durationMs: finalDuration,
      createdAt: Date.now(),
      scheduledStart: scheduledTime,
      status: 'pending',
      notifiedExpired: false,
    });

    setTitle('');
    setScheduledStart('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 shadow-sm flex flex-col gap-5"
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <h2 className="text-sm font-semibold text-[var(--ink-primary)]">New Task</h2>
        <span className="text-xs text-[var(--ink-secondary)] font-mono">Press N</span>
      </div>

      {/* Task Title */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="task-title-input" className="text-xs font-medium text-[var(--ink-secondary)]">
          Title
        </label>
        <input
          id="task-title-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What are you focusing on?"
          className="bg-[var(--surface-sunken)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--ink-primary)] placeholder-[var(--ink-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          required
        />
      </div>

      {/* Duration Chips */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[var(--ink-secondary)]">Duration</label>
        <div className="flex gap-1.5 flex-wrap">
          {PRESETS.map((preset) => {
            const selected = !isCustom && durationMs === preset.ms;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setDurationMs(preset.ms);
                  setIsCustom(false);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selected
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'bg-[var(--surface-sunken)] text-[var(--ink-secondary)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--ink-primary)]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setIsCustom(true)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isCustom
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'bg-[var(--surface-sunken)] text-[var(--ink-secondary)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--ink-primary)]'
            }`}
          >
            Custom
          </button>
        </div>

        {isCustom && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min="1"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="bg-[var(--surface-sunken)] border border-[var(--border)] rounded-md px-3 py-1.5 text-sm text-[var(--ink-primary)] focus:outline-none focus:border-[var(--accent)] w-24 text-center font-mono"
            />
            <span className="text-xs text-[var(--ink-secondary)]">minutes</span>
          </div>
        )}
      </div>

      {/* Scheduled Start */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="scheduled" className="text-xs font-medium text-[var(--ink-secondary)]">
          Scheduled start (optional)
        </label>
        <input
          id="scheduled"
          type="datetime-local"
          value={scheduledStart}
          onChange={(e) => setScheduledStart(e.target.value)}
          className="bg-[var(--surface-sunken)] border border-[var(--border)] rounded-md px-3 py-2 text-xs text-[var(--ink-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors w-full"
        />
      </div>

      {/* Create Button */}
      <button
        type="submit"
        className="mt-1 w-full bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white font-medium py-2.5 px-4 rounded-md text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        Create task
      </button>
    </form>
  );
}
