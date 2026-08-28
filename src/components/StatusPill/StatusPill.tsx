import type { TaskStatus } from '../../store/taskStore';

interface StatusPillProps {
  status: TaskStatus;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  pending: {
    label: 'Pending',
    color: 'var(--status-pending)',
    bg: 'rgba(139, 146, 160, 0.1)',
  },
  in_progress: {
    label: 'In progress',
    color: 'var(--status-progress)',
    bg: 'rgba(184, 134, 59, 0.12)',
  },
  completed: {
    label: 'Completed',
    color: 'var(--status-completed)',
    bg: 'rgba(63, 122, 92, 0.12)',
  },
  expired: {
    label: 'Expired',
    color: 'var(--status-expired)',
    bg: 'rgba(193, 68, 59, 0.12)',
  },
};

export function StatusPill({ status }: StatusPillProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: config.color }}
      />
      <span>{config.label}</span>
    </span>
  );
}
