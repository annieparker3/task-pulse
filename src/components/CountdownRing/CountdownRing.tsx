import { formatTimeRemaining } from '../../lib/time';

interface CountdownRingProps {
  remainingMs: number;
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  isExpired?: boolean;
}

export function CountdownRing({
  remainingMs,
  progress,
  size = 180,
  strokeWidth = 6,
  isExpired = false,
}: CountdownRingProps) {
  const radius = (size - strokeWidth * 2 - 16) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // Generate 60 tick marks around the watch bezel
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const angle = (i * 6) * (Math.PI / 180);
    const isMajor = i % 5 === 0;
    const tickLength = isMajor ? 8 : 4;
    const outerR = center - strokeWidth - 2;
    const innerR = outerR - tickLength;

    const x1 = center + outerR * Math.cos(angle);
    const y1 = center + outerR * Math.sin(angle);
    const x2 = center + innerR * Math.cos(angle);
    const y2 = center + innerR * Math.sin(angle);

    return { i, x1, y1, x2, y2, isMajor };
  });

  const strokeColor = isExpired
    ? 'var(--status-expired)'
    : 'var(--accent)';

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full p-2 bg-[var(--surface-sunken)] border border-[var(--border)] transition-colors duration-400 ${
        isExpired ? 'animate-dial-pulse' : ''
      }`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute inset-0">
        {/* Bezel Ticks */}
        {ticks.map((t) => (
          <line
            key={t.i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="var(--border-strong)"
            strokeWidth={t.isMajor ? 1.5 : 1}
            strokeOpacity={t.isMajor ? 0.7 : 0.4}
          />
        ))}

        {/* Dynamic Arc */}
        <g className="transform -rotate-90 origin-center">
          {/* Track background */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="var(--border)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-[stroke-dashoffset,stroke] duration-1000 ease-linear"
          />
        </g>
      </svg>

      {/* Center readout */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <span
          className={`font-mono text-2xl font-bold tabular-nums tracking-tight ${
            isExpired ? 'text-[var(--status-expired)]' : 'text-[var(--ink-primary)]'
          }`}
        >
          {isExpired ? '00:00' : formatTimeRemaining(remainingMs)}
        </span>
        <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-[var(--ink-secondary)] mt-0.5">
          {isExpired ? 'Time Expired' : 'Remaining'}
        </span>
      </div>
    </div>
  );
}
