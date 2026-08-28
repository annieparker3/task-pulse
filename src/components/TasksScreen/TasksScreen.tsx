import { useTaskStore } from '../../store/taskStore';
import { requestNotificationPermission } from '../../services/notificationService';
import { Play, Plus, Trash2, Clock } from 'lucide-react';
import { format } from 'date-fns';

export function TasksScreen() {
  const { tasks, updateTask, deleteTask, setAddTaskOpen, setActiveTab } = useTaskStore();

  const pending = tasks.filter((t) => t.status === 'pending');
  const active = tasks.filter((t) => t.status === 'in_progress' || t.status === 'expired');

  const handleStart = async (task: (typeof tasks)[0]) => {
    await requestNotificationPermission();
    updateTask({
      ...task,
      status: 'in_progress',
      startedAt: Date.now(),
    });
    setActiveTab('timer');
  };

  const formatDurationLabel = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ''}`;
    return `${m}m`;
  };

  return (
    <div className="flex flex-col gap-6 py-4 px-4 pb-24 lg:pb-6 w-full">
      {/* Top Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Tasks</h2>
          <p className="text-xs text-[var(--ink-secondary)]">
            {pending.length} queued • {active.length} active
          </p>
        </div>

        <button
          onClick={() => setAddTaskOpen(true)}
          className="bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white font-semibold p-2.5 rounded-full shadow-md transition-transform active:scale-95 flex items-center justify-center"
          title="Add New Task"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Active Tasks List */}
      {active.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
            Currently Timing ({active.length})
          </h3>
          {active.map((task) => (
            <div
              key={task.id}
              onClick={() => setActiveTab('timer')}
              className="bg-[var(--surface)] border border-[var(--accent)] rounded-2xl p-4 flex items-center justify-between shadow-md cursor-pointer hover:bg-[var(--surface-sunken)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-ping" />
                <div>
                  <h4 className="font-semibold text-white text-base">{task.title}</h4>
                  <span className="text-xs text-[var(--ink-secondary)]">
                    {formatDurationLabel(task.durationMs)}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('timer');
                }}
                className="text-xs font-medium text-[var(--accent)] bg-[var(--accent)]/15 px-3 py-1.5 rounded-full"
              >
                View Timer
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Queued Tasks List */}
      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-secondary)]">
          Queued Tasks ({pending.length})
        </h3>

        {pending.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center flex flex-col items-center justify-center">
            <Clock size={32} className="text-[var(--ink-secondary)] mb-2" />
            <p className="text-sm font-medium text-white">No tasks queued</p>
            <p className="text-xs text-[var(--ink-secondary)] mt-1">Tap + to add a task to your queue</p>
          </div>
        ) : (
          pending.map((task) => (
            <div
              key={task.id}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-[var(--surface-border)] transition-colors"
            >
              <div className="min-w-0 flex-1 pr-3">
                <h4 className="font-semibold text-white text-base truncate">{task.title}</h4>
                <div className="flex items-center gap-2 text-xs text-[var(--ink-secondary)] mt-0.5">
                  <span>{formatDurationLabel(task.durationMs)}</span>
                  {task.scheduledStart && (
                    <>
                      <span>•</span>
                      <span>Starts {format(task.scheduledStart, 'HH:mm')}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleStart(task)}
                  className="w-9 h-9 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white flex items-center justify-center shadow-md transition-transform active:scale-95"
                  title="Start Task"
                >
                  <Play size={16} className="ml-0.5 fill-current" />
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="w-9 h-9 rounded-full bg-[var(--surface-sunken)] hover:bg-red-500/20 text-[var(--ink-secondary)] hover:text-red-400 flex items-center justify-center transition-colors"
                  title="Delete Task"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
