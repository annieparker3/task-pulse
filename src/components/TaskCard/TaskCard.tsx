import { useTaskStore, type Task } from '../../store/taskStore';
import { useTaskTimer } from '../../hooks/useTaskTimer';
import { requestNotificationPermission } from '../../services/notificationService';
import { CountdownRing } from '../CountdownRing/CountdownRing';
import { StatusPill } from '../StatusPill/StatusPill';
import { Play, Check, Trash2, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  compact?: boolean;
}

const formatDurationLabel = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  if (minutes >= 60) {
    const hours = (minutes / 60).toFixed(minutes % 60 === 0 ? 0 : 1);
    return `${hours}h`;
  }
  return `${minutes}m`;
};

export function TaskCard({ task, compact = false }: TaskCardProps) {
  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);

  const { remainingMs, progress } = useTaskTimer(task);

  const isPending = task.status === 'pending';
  const isCompleted = task.status === 'completed';
  const isExpired = task.status === 'expired';

  const handleStart = async () => {
    await requestNotificationPermission();
    updateTask({
      ...task,
      status: 'in_progress',
      startedAt: Date.now(),
    });
  };

  const handleDone = () => {
    updateTask({
      ...task,
      status: 'completed',
      completedAt: Date.now(),
    });
  };

  const handleDelete = () => {
    deleteTask(task.id);
  };

  // Compact Row Representation (for Queued or Completed tasks)
  if (compact || isPending || isCompleted) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3.5 flex items-center justify-between gap-3 shadow-sm hover:border-[var(--border-strong)] transition-all">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <StatusPill status={task.status} />
          <div className="min-w-0 flex-1">
            <h4
              className={`text-sm font-medium truncate ${
                isCompleted ? 'line-through text-[var(--ink-secondary)]' : 'text-[var(--ink-primary)]'
              }`}
            >
              {task.title}
            </h4>
            <div className="text-xs text-[var(--ink-secondary)] flex items-center gap-2 mt-0.5">
              <span>{formatDurationLabel(task.durationMs)}</span>
              {task.scheduledStart && (
                <>
                  <span>•</span>
                  <span>Starts {format(task.scheduledStart, 'HH:mm')}</span>
                </>
              )}
              {isCompleted && task.completedAt && (
                <>
                  <span>•</span>
                  <span>Done at {format(task.completedAt, 'HH:mm')}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isPending && (
            <button
              onClick={handleStart}
              className="p-1.5 rounded-md border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--ink-secondary)] transition-colors"
              title="Start task"
            >
              <Play size={15} />
            </button>
          )}
          {isCompleted && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-md border border-[var(--border)] hover:border-[var(--status-expired)] hover:text-[var(--status-expired)] text-[var(--ink-secondary)] transition-colors"
              title="Delete task"
            >
              <Trash2 size={15} />
            </button>
          )}
          {isPending && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-md border border-[var(--border)] hover:border-[var(--status-expired)] hover:text-[var(--status-expired)] text-[var(--ink-secondary)] transition-colors"
              title="Delete task"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full Chronograph Dial Card Representation (for Active / Expired tasks)
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 flex flex-col items-center justify-between gap-5 shadow-md relative overflow-hidden transition-all">
      {/* Top Bar: Title & Status */}
      <div className="w-full flex items-start justify-between gap-2">
        <div>
          <StatusPill status={task.status} />
          <h3 className="font-display text-lg font-semibold text-[var(--ink-primary)] mt-2 leading-tight">
            {task.title}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleDone}
            className="p-2 rounded-md bg-[var(--status-completed)] text-white hover:opacity-90 transition-opacity"
            title="Mark Done"
          >
            <Check size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-md border border-[var(--border)] hover:border-[var(--status-expired)] hover:text-[var(--status-expired)] text-[var(--ink-secondary)] transition-colors"
            title="Delete task"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* The Signature Chronograph Dial */}
      <div className="py-2">
        <CountdownRing
          remainingMs={remainingMs}
          progress={progress}
          size={180}
          strokeWidth={6}
          isExpired={isExpired}
        />
      </div>

      {/* Footer Meta */}
      <div className="w-full pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--ink-secondary)] font-sans">
        <div className="flex items-center gap-1.5">
          <Clock size={14} />
          <span>Total duration: {formatDurationLabel(task.durationMs)}</span>
        </div>
        {task.startedAt && (
          <span>Started {format(task.startedAt, 'HH:mm')}</span>
        )}
      </div>
    </div>
  );
}
