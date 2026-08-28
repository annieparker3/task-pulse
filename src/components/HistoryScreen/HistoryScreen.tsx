import { useTaskStore } from '../../store/taskStore';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export function HistoryScreen() {
  const { tasks, deleteTask } = useTaskStore();

  const completed = tasks.filter((t) => t.status === 'completed');

  const totalCompletedMs = completed.reduce((acc, t) => {
    if (t.completedAt && t.startedAt) {
      return acc + (t.completedAt - t.startedAt);
    }
    return acc + t.durationMs;
  }, 0);

  const totalHours = (totalCompletedMs / (1000 * 60 * 60)).toFixed(1);

  return (
    <div className="flex flex-col gap-6 py-4 px-4 pb-24 lg:pb-6 w-full">
      {/* Top Header & Summary Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">History</h2>
          <p className="text-xs text-[var(--ink-secondary)]">Completed session log</p>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-4 py-2 text-right shadow-sm">
          <span className="text-[10px] uppercase font-semibold text-[var(--ink-secondary)] block">Focused Time</span>
          <span className="font-mono text-lg font-bold text-[var(--status-completed)]">{totalHours} hrs</span>
        </div>
      </div>

      {/* Completed Session Cards */}
      <section className="flex flex-col gap-3">
        {completed.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center flex flex-col items-center justify-center">
            <CheckCircle2 size={32} className="text-[var(--ink-secondary)] mb-2" />
            <p className="text-sm font-medium text-white">No completed tasks yet</p>
            <p className="text-xs text-[var(--ink-secondary)] mt-1">Finish a task timer to log your focus history</p>
          </div>
        ) : (
          completed.map((task) => (
            <div
              key={task.id}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                <CheckCircle2 size={20} className="text-[var(--status-completed)] shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-white text-base truncate">{task.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-[var(--ink-secondary)] mt-0.5">
                    {task.completedAt && (
                      <span>Done at {format(task.completedAt, 'MMM d, HH:mm')}</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => deleteTask(task.id)}
                className="w-8 h-8 rounded-full bg-[var(--surface-sunken)] hover:bg-red-500/20 text-[var(--ink-secondary)] hover:text-red-400 flex items-center justify-center transition-colors shrink-0"
                title="Remove Log"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
