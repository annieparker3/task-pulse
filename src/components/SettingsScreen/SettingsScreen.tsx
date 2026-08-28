import { useState } from 'react';
import { getIsMuted, toggleMute } from '../../services/audioService';
import { requestNotificationPermission } from '../../services/notificationService';
import { Volume2, VolumeX, Bell, Info } from 'lucide-react';

export function SettingsScreen() {
  const [muted, setMuted] = useState(getIsMuted());
  const [notifGranted, setNotifGranted] = useState(() => {
    return 'Notification' in window && Notification.permission === 'granted';
  });

  const handleToggleSound = () => {
    const isNowMuted = toggleMute();
    setMuted(isNowMuted);
  };

  const handleRequestNotif = async () => {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
  };

  return (
    <div className="flex flex-col gap-6 py-4 px-4 pb-24 lg:pb-6 w-full">
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-xs text-[var(--ink-secondary)]">Preferences & system options</p>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm flex flex-col divide-y divide-[var(--border)]">
        {/* Audio Chime Toggle */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--surface-sunken)] flex items-center justify-center text-[var(--accent)]">
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Timer Alert Sound</h4>
              <p className="text-xs text-[var(--ink-secondary)]">Play chime audio when timer finishes</p>
            </div>
          </div>

          <button
            onClick={handleToggleSound}
            className={`w-12 h-7 rounded-full p-1 transition-colors ${
              !muted ? 'bg-[var(--accent)]' : 'bg-[var(--surface-sunken)]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                !muted ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* System Notification Permission */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--surface-sunken)] flex items-center justify-center text-[var(--status-info)]">
              <Bell size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">System Notifications</h4>
              <p className="text-xs text-[var(--ink-secondary)]">
                {notifGranted ? 'Granted' : 'Request OS notification permission'}
              </p>
            </div>
          </div>

          {!notifGranted ? (
            <button
              onClick={handleRequestNotif}
              className="bg-[var(--status-info)] text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
            >
              Enable
            </button>
          ) : (
            <span className="text-xs font-semibold text-[var(--status-completed)]">Active</span>
          )}
        </div>
      </div>

      {/* About Box */}
      <div className="bg-[var(--surface-sunken)] rounded-2xl p-4 border border-[var(--border)] flex items-start gap-3">
        <Info size={18} className="text-[var(--accent)] shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--ink-secondary)] leading-relaxed">
          <p className="font-semibold text-white mb-1">TaskPulse — Precision Timekeeper</p>
          <p>Local-first app. Timers run in background workers based on timestamp math, ensuring accuracy across system sleeps and tab switches.</p>
        </div>
      </div>
    </div>
  );
}
