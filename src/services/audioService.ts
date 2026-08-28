// Web Audio API Synthesizer Chime with Mute Toggle
let isMuted = localStorage.getItem('taskpulse_muted') === 'true';

export const getIsMuted = () => isMuted;

export const toggleMute = () => {
  isMuted = !isMuted;
  localStorage.setItem('taskpulse_muted', String(isMuted));
  return isMuted;
};

export const playChime = () => {
  if (isMuted) return;

  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    // Dual-tone high tech chime (880Hz A5 -> 1320Hz E6)
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playNote(880, now, 0.4);
    playNote(1320, now + 0.15, 0.6);
  } catch (err) {
    console.warn('Audio chime playback failed:', err);
  }
};
