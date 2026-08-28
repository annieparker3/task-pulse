import { useTaskStore } from '../../store/taskStore';
import { Timer, Clock, CheckCircle2, Settings } from 'lucide-react';

export function BottomNav() {
  const { activeTab, setActiveTab } = useTaskStore();

  const tabs = [
    { id: 'timer', label: 'Timer', icon: Timer },
    { id: 'tasks', label: 'Tasks', icon: Clock },
    { id: 'history', label: 'History', icon: CheckCircle2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/90 backdrop-blur-md border-t border-[var(--surface-border)] px-4 py-2 flex justify-around items-center">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
              isActive
                ? 'text-[var(--accent)]'
                : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
            }`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
            <span className="text-[10px] font-medium tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
