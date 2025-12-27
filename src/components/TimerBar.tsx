'use client';

interface TimerBarProps {
  percent: number;
}

export default function TimerBar({ percent }: TimerBarProps) {
  return (
    <div className="timer-bar">
      <div className="timer-bar-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
