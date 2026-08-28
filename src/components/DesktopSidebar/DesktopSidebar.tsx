import { useTaskStore } from '../../store/taskStore';
import { Timer, Clock, CheckCircle2, Settings, Plus, Zap } from 'lucide-react';

export function DesktopSidebar() {
  const { activeTab, setActiveTab, tasks, setAddTaskOpen } = useTaskStore();

  const tabs = [
    { id: 'timer', label: 'Timer', icon: Timer, description: 'Active countdown' },
    { id: 'tasks', label: 'Tasks', icon: Clock, description: 'Queue & manage' },
    { id: 'history', label: 'History', icon: CheckCircle2, description: 'Session log' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'Preferences' },
  ] as const;

  const activeCount = tasks.filter((t) => t.status === 'in_progress' || t.status === 'expired').length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <aside className="w-64 min-h-screen bg-[var(--surface)] border-r border-[var(--surface-border)] flex flex-col shrink-0">
      {/* Brand */}
      <div className="px-6 pt-8 pb-6 border-b border-[var(--surface-border)]">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-md">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <div>
            <p className="font-bold text-white text-base leading-none">TaskPulse</p>
            <p className="text-[10px] text-[var(--ink-secondary)] mt-0.5">Precision Timekeeper</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-4 py-4 border-b border-[var(--surface-border)] grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center bg-[var(--surface-sunken)] rounded-xl py-2.5">
          <span className="font-bold text-[var(--accent)] text-lg leading-none">{activeCount}</span>
          <span className="text-[9px] text-[var(--ink-secondary)] mt-1 font-medium">Active</span>
        </div>
        <div className="flex flex-col items-center bg-[var(--surface-sunken)] rounded-xl py-2.5">
          <span className="font-bold text-white text-lg leading-none">{pendingCount}</span>
          <span className="text-[9px] text-[var(--ink-secondary)] mt-1 font-medium">Queued</span>
        </div>
        <div className="flex flex-col items-center bg-[var(--surface-sunken)] rounded-xl py-2.5">
          <span className="font-bold text-[var(--status-completed)] text-lg leading-none">{completedCount}</span>
          <span className="text-[9px] text-[var(--ink-secondary)] mt-1 font-medium">Done</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all group ${
                isActive
                  ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                  : 'text-[var(--ink-secondary)] hover:bg-[var(--surface-sunken)] hover:text-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                isActive
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface-sunken)] text-[var(--ink-secondary)] group-hover:text-white'
              }`}>
                <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold leading-none ${isActive ? 'text-[var(--accent)]' : ''}`}>
                  {tab.label}
                </p>
                <p className="text-[10px] text-[var(--ink-secondary)] mt-0.5">{tab.description}</p>
              </div>
              {tab.id === 'timer' && activeCount > 0 && (
                <span className="ml-auto w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom CTA */}
      <div className="px-4 pb-6 pt-2 border-t border-[var(--surface-border)]">
        <button
          onClick={() => setAddTaskOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white font-semibold py-3 rounded-xl transition-colors shadow-md text-sm"
        >
          <Plus size={16} />
          New Task
        </button>
      </div>
    </aside>
  );
}
