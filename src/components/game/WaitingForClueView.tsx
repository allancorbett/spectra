'use client';

import ColorWheel from '@/components/ColorWheel';
import { GameMode } from '@/lib/types';

interface WaitingForClueViewProps {
  roundNumber: number;
  cluePhase: 1 | 2;
  mode: GameMode;
  clueGiverName: string;
  currentClue: string | null;
  timerEnabled: boolean;
  timeLeft: number | null;
}

export default function WaitingForClueView({
  roundNumber,
  cluePhase,
  mode,
  clueGiverName,
  currentClue,
  timerEnabled,
  timeLeft,
}: WaitingForClueViewProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
      <div className="text-center">
        <p className="text-sm text-foreground/60">Round {roundNumber}</p>
        {mode === 'remote' ? (
          <>
            <h2 className="text-2xl font-bold mb-4">
              {currentClue ? 'The clue is:' : `Waiting for ${clueGiverName}'s clue...`}
            </h2>
            {currentClue && (
              <p className="text-3xl font-bold text-primary animate-pulse">
                &quot;{currentClue}&quot;
              </p>
            )}
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">Listen for the clue!</h2>
            <p className="text-foreground/60">
              {cluePhase === 1 ? 'ONE word' : 'TWO words'}
            </p>
          </>
        )}
      </div>
      <div className="animate-pulse">
        <ColorWheel size={200} disabled />
      </div>
      {timerEnabled && timeLeft !== null && (
        <p className="text-3xl font-bold">{timeLeft}s</p>
      )}
    </div>
  );
}
