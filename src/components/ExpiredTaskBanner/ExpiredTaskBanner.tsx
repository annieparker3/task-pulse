import { useTaskStore } from '../../store/taskStore';
import { AlertCircle, Check } from 'lucide-react';

export function ExpiredTaskBanner() {
  const { tasks, updateTask } = useTaskStore();

  const expiredTasks = tasks.filter((t) => t.status === 'expired');

  if (expiredTasks.length === 0) return null;

  const handleMarkDone = (task: (typeof expiredTasks)[0]) => {
    updateTask({
      ...task,
      status: 'completed',
      completedAt: Date.now(),
    });
  };

  return (
    <div className="bg-[var(--status-expired)] text-white rounded-lg p-4 shadow-md flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
        <AlertCircle size={16} className="shrink-0" />
        <span>Time limit reached for {expiredTasks.length} task(s)</span>
      </div>

      <div className="flex flex-col gap-2">
        {expiredTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between bg-[var(--surface)] text-[var(--ink-primary)] rounded-md p-2.5 text-xs font-sans shadow-sm border border-[var(--border)]"
          >
            <span className="truncate font-medium">{task.title}</span>
            <button
              onClick={() => handleMarkDone(task)}
              className="flex items-center gap-1 bg-[var(--status-completed)] text-white px-2.5 py-1 rounded text-xs font-medium hover:opacity-90 transition-opacity ml-2 shrink-0"
            >
              <Check size={14} />
              Mark done
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
