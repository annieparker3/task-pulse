import { useTaskStore } from '../../store/taskStore';
import { useTaskTimer } from '../../hooks/useTaskTimer';
import { formatTimeRemaining } from '../../lib/time';
import { requestNotificationPermission } from '../../services/notificationService';
import { Play, Check, Plus, AlertCircle } from 'lucide-react';

export function TimerScreen() {
  const { tasks, updateTask, extendTask, setAddTaskOpen } = useTaskStore();

  // Find active task (in_progress or expired)
  const activeTask = tasks.find((t) => t.status === 'in_progress' || t.status === 'expired') 
    || tasks.find((t) => t.status === 'pending');

  const { remainingMs, progress } = useTaskTimer(activeTask || {
    id: '',
    userId: '',
    title: '',
    durationMs: 0,
    createdAt: 0,
    status: 'pending',
    notifiedExpired: false,
  });

  const isRunning = activeTask?.status === 'in_progress';
  const isExpired = activeTask?.status === 'expired';
  const isPending = activeTask?.status === 'pending';

  const handleStart = async () => {
    if (!activeTask) {
      setAddTaskOpen(true);
      return;
    }
    await requestNotificationPermission();
    updateTask({
      ...activeTask,
      status: 'in_progress',
      startedAt: Date.now(),
    });
  };

  const handleDone = () => {
    if (!activeTask) return;
    updateTask({
      ...activeTask,
      status: 'completed',
      completedAt: Date.now(),
    });
  };

  const handleExtend = (minutes: number) => {
    if (!activeTask) return;
    extendTask(activeTask.id, minutes * 60 * 1000);
  };

  if (!activeTask) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] text-center px-4">
        <div className="w-20 h-20 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--accent)] mb-6 shadow-lg border border-[var(--surface-border)]">
          <Play size={36} className="ml-1" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Active Timer</h2>
        <p className="text-sm text-[var(--ink-secondary)] max-w-xs mb-8">
          Select an existing task or create a new one to begin your focused countdown.
        </p>
        <button
          onClick={() => setAddTaskOpen(true)}
          className="bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-transform active:scale-95 flex items-center gap-2 text-base"
        >
          <Plus size={20} />
          Create Task
        </button>
      </div>
    );
  }

  // Hero Countdown Dial Math
  const dialSize = 260;
  const strokeWidth = 8;
  const radius = (dialSize - strokeWidth * 2) / 2;
  const center = dialSize / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - (isRunning ? progress : 1));

  return (
    <div className="flex flex-col items-center justify-between min-h-[70vh] py-6 px-4">
      {/* Top Meta Info */}
      <div className="text-center">
        <span className="text-xs uppercase tracking-widest text-[var(--ink-secondary)] font-semibold">
          {isRunning ? 'Counting down' : isExpired ? "Time's up" : 'Ready to start'}
        </span>
        <h2 className="text-xl font-bold text-white mt-1 max-w-xs truncate">
          {activeTask.title}
        </h2>
      </div>

      {/* Hero Circular Dial */}
      <div className="relative inline-flex items-center justify-center my-4">
        <svg width={dialSize} height={dialSize} className="transform -rotate-90">
          {/* Outer Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="var(--surface-sunken)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Orange Progress Arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={isExpired ? 'var(--status-expired)' : 'var(--accent)'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={isExpired ? 0 : strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>

        {/* Center Countdown Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <span className="font-mono text-4xl sm:text-5xl font-light text-white tabular-nums tracking-tighter">
            {isExpired
              ? '00:00:00'
              : isRunning
              ? formatTimeRemaining(remainingMs)
              : formatTimeRemaining(activeTask.durationMs)}
          </span>
          <span className="text-xs text-[var(--ink-secondary)] mt-2 font-medium">
            {isRunning ? `${Math.round(progress * 100)}% remaining` : `${Math.floor(activeTask.durationMs / 60000)}m block`}
          </span>
        </div>
      </div>

      {/* Expiry Banner & Extension Quick Action */}
      {isExpired && (
        <div className="w-full max-w-sm bg-[var(--status-expired)]/15 border border-[var(--status-expired)] rounded-2xl p-4 mb-4 text-center">
          <div className="flex items-center justify-center gap-2 text-[var(--status-expired)] font-semibold text-sm mb-3">
            <AlertCircle size={18} />
            <span>Task session completed!</span>
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => handleExtend(15)}
              className="bg-[var(--surface-sunken)] hover:bg-[var(--surface-border)] text-white text-xs font-semibold px-3 py-2 rounded-full transition-colors"
            >
              +15 min
            </button>
            <button
              onClick={() => handleExtend(30)}
              className="bg-[var(--surface-sunken)] hover:bg-[var(--surface-border)] text-white text-xs font-semibold px-3 py-2 rounded-full transition-colors"
            >
              +30 min
            </button>
          </div>
        </div>
      )}

      {/* Primary Action Buttons */}
      <div className="w-full max-w-xs flex flex-col gap-3">
        {isPending && (
          <button
            onClick={handleStart}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white font-semibold py-4 rounded-full text-base shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-2"
          >
            <Play size={20} className="fill-current" />
            Start Timer
          </button>
        )}

        {isRunning && (
          <div className="flex gap-3 w-full">
            <button
              onClick={() => handleExtend(15)}
              className="flex-1 bg-[var(--surface)] hover:bg-[var(--surface-sunken)] text-white font-medium py-3.5 rounded-full text-sm border border-[var(--surface-border)] transition-colors"
            >
              +15 Min
            </button>
            <button
              onClick={handleDone}
              className="flex-1 bg-[var(--status-completed)] hover:opacity-90 text-white font-semibold py-3.5 rounded-full text-sm shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              <Check size={18} />
              End Task
            </button>
          </div>
        )}

        {isExpired && (
          <button
            onClick={handleDone}
            className="w-full bg-[var(--status-completed)] hover:opacity-90 text-white font-semibold py-4 rounded-full text-base shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-2"
          >
            <Check size={20} />
            Mark Complete
          </button>
        )}
      </div>
    </div>
  );
}
