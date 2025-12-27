'use client';

import ColorGrid from '@/components/ColorGrid';
import TimerBar from '@/components/TimerBar';
import { indexToColor } from '@/lib/colors';
import { ColorComplexity, getGridDimensions, Guess } from '@/lib/types';

interface GuessingViewProps {
  roundNumber: number;
  guessNumber: 1 | 2;
  complexity: ColorComplexity;
  selectedHue: number | null;
  selectedSaturation: number | null;
  hasLockedIn: boolean;
  displayGuesses: Guess[];
  playerColorMap: Map<string, number>;
  playerNameMap: Map<string, string>;
  lockedInCount: number;
  guesserCount: number;
  timerEnabled: boolean;
  timerPercent: number;
  timeLeft: number | null;
  onCellClick: (hue: number, saturation: number) => void;
  onLockIn: () => void;
}

export default function GuessingView({
  roundNumber,
  guessNumber,
  complexity,
  selectedHue,
  selectedSaturation,
  hasLockedIn,
  displayGuesses,
  playerColorMap,
  playerNameMap,
  lockedInCount,
  guesserCount,
  timerEnabled,
  timerPercent,
  timeLeft,
  onCellClick,
  onLockIn,
}: GuessingViewProps) {
  const gridDims = getGridDimensions(complexity);

  return (
    <div className="flex-1 flex flex-col p-4 gap-4">
      <div className="text-center">
        <p className="text-sm text-foreground/60">Round {roundNumber}</p>
        <h2 className="text-xl font-bold">
          {hasLockedIn
            ? 'Waiting for others...'
            : `Place your ${guessNumber === 1 ? 'first' : 'second'} guess`}
        </h2>
      </div>

      {timerEnabled && timeLeft !== null && <TimerBar percent={timerPercent} />}

      <ColorGrid
        selectedHue={selectedHue}
        selectedSaturation={selectedSaturation}
        guesses={displayGuesses}
        playerColorMap={playerColorMap}
        playerNameMap={playerNameMap}
        onCellClick={onCellClick}
        disabled={hasLockedIn}
        complexity={complexity}
      />

      {selectedHue !== null && selectedSaturation !== null && !hasLockedIn && (
        <div className="flex justify-center">
          <div
            className="w-16 h-16 rounded-xl shadow-lg"
            style={{
              backgroundColor: indexToColor(selectedHue, selectedSaturation, gridDims.hue, gridDims.chroma),
            }}
          />
        </div>
      )}

      <div className="space-y-2">
        {!hasLockedIn && (
          <button
            onClick={onLockIn}
            disabled={selectedHue === null || selectedSaturation === null}
            className="btn btn-success w-full"
          >
            Lock In
          </button>
        )}
        {timerEnabled && timeLeft !== null && (
          <p className="text-center text-2xl font-bold">{timeLeft}s</p>
        )}
        <p className="text-center text-foreground/60 text-sm">
          {lockedInCount}/{guesserCount} players locked in
        </p>
      </div>
    </div>
  );
}
