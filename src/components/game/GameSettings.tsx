'use client';

import { clsx } from 'clsx';
import { ColorComplexity, GameMode, GameSettings as GameSettingsType, getGridDimensions } from '@/lib/types';

interface GameSettingsProps {
  settings: GameSettingsType;
  isHost: boolean;
  onUpdate: (settings: Partial<GameSettingsType>) => void;
}

export default function GameSettings({ settings, isHost, onUpdate }: GameSettingsProps) {
  const gridDims = getGridDimensions(settings.complexity);

  if (!isHost) {
    return (
      <div className="card">
        <h2 className="font-semibold mb-2">Game Settings</h2>
        <div className="text-sm text-foreground/60 space-y-1">
          <p>
            Mode:{' '}
            <span className="text-foreground">
              {settings.mode === 'together' ? 'Together (same room)' : 'Remote (typed clues)'}
            </span>
          </p>
          <p>
            Colors:{' '}
            <span className="text-foreground">
              {settings.complexity} ({gridDims.hue * gridDims.chroma})
            </span>
          </p>
          <p>
            Timer:{' '}
            <span className="text-foreground">
              {settings.timerEnabled ? '30 seconds' : 'Off'}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="font-semibold mb-3">Game Settings</h2>

      {/* Mode Selection */}
      <div className="mb-4">
        <label className="text-sm text-foreground/60 block mb-2">Play Mode</label>
        <div className="grid grid-cols-2 gap-2">
          <ModeButton
            mode="together"
            label="Together"
            subtitle="Same room"
            isActive={settings.mode === 'together'}
            onClick={() => onUpdate({ mode: 'together' })}
          />
          <ModeButton
            mode="remote"
            label="Remote"
            subtitle="Type clues"
            isActive={settings.mode === 'remote'}
            onClick={() => onUpdate({ mode: 'remote' })}
          />
        </div>
      </div>

      {/* Complexity Selection */}
      <div className="mb-4">
        <label className="text-sm text-foreground/60 block mb-2">Color Complexity</label>
        <div className="grid grid-cols-3 gap-2">
          {(['simple', 'normal', 'complex'] as const).map((level) => {
            const dims = getGridDimensions(level);
            return (
              <ComplexityButton
                key={level}
                level={level}
                colorCount={dims.hue * dims.chroma}
                isActive={settings.complexity === level}
                onClick={() => onUpdate({ complexity: level })}
              />
            );
          })}
        </div>
      </div>

      {/* Timer Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground/60">30s Timer</span>
        <button
          onClick={() => onUpdate({ timerEnabled: !settings.timerEnabled })}
          className={clsx(
            'relative w-12 h-6 rounded-full transition-colors',
            settings.timerEnabled ? 'bg-primary' : 'bg-secondary'
          )}
        >
          <div
            className={clsx(
              'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
              settings.timerEnabled ? 'translate-x-7' : 'translate-x-1'
            )}
          />
        </button>
      </div>
    </div>
  );
}

function ModeButton({
  mode,
  label,
  subtitle,
  isActive,
  onClick,
}: {
  mode: GameMode;
  label: string;
  subtitle: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'p-3 rounded-lg text-sm font-medium transition-colors',
        isActive ? 'bg-primary text-white' : 'bg-secondary hover:bg-secondary/80'
      )}
    >
      {label}
      <span className="block text-xs opacity-70">{subtitle}</span>
    </button>
  );
}

function ComplexityButton({
  level,
  colorCount,
  isActive,
  onClick,
}: {
  level: ColorComplexity;
  colorCount: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'p-2 rounded-lg text-sm font-medium transition-colors',
        isActive ? 'bg-primary text-white' : 'bg-secondary hover:bg-secondary/80'
      )}
    >
      {level.charAt(0).toUpperCase() + level.slice(1)}
      <span className="block text-xs opacity-70">{colorCount}</span>
    </button>
  );
}
