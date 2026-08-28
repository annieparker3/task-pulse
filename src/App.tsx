import { useEffect } from 'react';
import { useTaskStore } from './store/taskStore';
import { registerServiceWorker, requestNotificationPermission } from './services/notificationService';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { TimerScreen } from './components/TimerScreen/TimerScreen';
import { TasksScreen } from './components/TasksScreen/TasksScreen';
import { HistoryScreen } from './components/HistoryScreen/HistoryScreen';
import { SettingsScreen } from './components/SettingsScreen/SettingsScreen';
import { BottomNav } from './components/BottomNav/BottomNav';
import { AddTaskModal } from './components/AddTaskModal/AddTaskModal';
import { DesktopSidebar } from './components/DesktopSidebar/DesktopSidebar';
import { Plus, Timer } from 'lucide-react';

function App() {
  const { activeTab, setAddTaskOpen, loadTasks, isLoaded } = useTaskStore();

  useKeyboardShortcuts();

  useEffect(() => {
    const init = async () => {
      await registerServiceWorker();
      await requestNotificationPermission();
      if (!isLoaded) {
        loadTasks();
      }
    };
    init();
  }, [isLoaded, loadTasks]);

  const activeScreen = (
    <>
      {activeTab === 'timer' && <TimerScreen />}
      {activeTab === 'tasks' && <TasksScreen />}
      {activeTab === 'history' && <HistoryScreen />}
      {activeTab === 'settings' && <SettingsScreen />}
    </>
  );

  return (
    <>
      {/* ─────────── MOBILE LAYOUT (< lg) ─────────── */}
      <div className="lg:hidden min-h-screen bg-[#000000] text-white flex flex-col font-sans selection:bg-[var(--accent)] selection:text-white">
        {/* Mobile Top Bar */}
        <header className="w-full max-w-lg mx-auto px-4 pt-10 pb-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center text-[var(--accent)]">
              <Timer size={18} />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">TaskPulse</span>
          </div>
          <button
            onClick={() => setAddTaskOpen(true)}
            className="flex items-center gap-1.5 bg-[var(--surface)] hover:bg-[var(--surface-sunken)] border border-[var(--surface-border)] text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
          >
            <Plus size={15} className="text-[var(--accent)]" />
            <span>New Task</span>
          </button>
        </header>

        {/* Mobile Screen Content */}
        <main className="flex-1 w-full max-w-lg mx-auto overflow-y-auto">
          {activeScreen}
        </main>

        {/* Mobile Bottom Nav */}
        <BottomNav />
      </div>

      {/* ─────────── DESKTOP LAYOUT (≥ lg) ─────────── */}
      <div className="hidden lg:flex min-h-screen bg-[#000000] text-white font-sans selection:bg-[var(--accent)] selection:text-white">
        {/* Left Sidebar */}
        <DesktopSidebar />

        {/* Right Content Panel */}
        <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
          {/* Desktop Top Bar */}
          <header className="w-full px-10 pt-8 pb-4 flex items-center justify-between border-b border-[var(--surface-border)] shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-white capitalize">{activeTab}</h1>
              <p className="text-xs text-[var(--ink-secondary)] mt-0.5">TaskPulse — Precision Timekeeper</p>
            </div>
            <button
              onClick={() => setAddTaskOpen(true)}
              className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors shadow-lg"
            >
              <Plus size={16} />
              New Task
            </button>
          </header>

          {/* Desktop Screen Content — max-width centered */}
          <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-6">
            {activeScreen}
          </main>
        </div>
      </div>

      {/* Add Task Modal (shared) */}
      <AddTaskModal />
    </>
  );
}

export default App;

