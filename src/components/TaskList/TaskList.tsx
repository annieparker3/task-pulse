import { useEffect } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { TaskCard } from '../TaskCard/TaskCard';
import { Clock } from 'lucide-react';

export function TaskList() {
  const { tasks, isLoaded, loadTasks } = useTaskStore();

  useEffect(() => {
    if (!isLoaded) {
      loadTasks();
    }
  }, [isLoaded, loadTasks]);

  if (!isLoaded) {
    return (
      <div className="text-[var(--ink-secondary)] text-sm animate-pulse py-8 text-center">
        Loading tasks...
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-10 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center text-[var(--accent)] mb-3">
          <Clock size={24} />
        </div>
        <h3 className="font-display text-base font-semibold text-[var(--ink-primary)]">
          No tasks queued
        </h3>
        <p className="text-xs text-[var(--ink-secondary)] mt-1 max-w-xs">
          Create a task in the left panel to begin your time-allocated focus session.
        </p>
      </div>
    );
  }

  const active = tasks.filter((t) => t.status === 'in_progress' || t.status === 'expired');
  const pending = tasks.filter((t) => t.status === 'pending');
  const completed = tasks.filter((t) => t.status === 'completed');

  return (
    <div className="flex flex-col gap-8">
      {/* Active Tasks Grid */}
      {active.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border)]">
            <h3 className="text-xs font-medium text-[var(--ink-secondary)] uppercase tracking-wider">
              In progress ({active.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {active.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </section>
      )}

      {/* Queued Tasks */}
      {pending.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border)]">
            <h3 className="text-xs font-medium text-[var(--ink-secondary)] uppercase tracking-wider">
              Upcoming ({pending.length})
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            {pending.map((task) => (
              <TaskCard key={task.id} task={task} compact />
            ))}
          </div>
        </section>
      )}

      {/* Completed Tasks */}
      {completed.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border)]">
            <h3 className="text-xs font-medium text-[var(--ink-secondary)] uppercase tracking-wider">
              Completed ({completed.length})
            </h3>
          </div>
          <div className="flex flex-col gap-2 opacity-75">
            {completed.map((task) => (
              <TaskCard key={task.id} task={task} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
