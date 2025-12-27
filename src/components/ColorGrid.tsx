'use client';

import { useMemo } from 'react';
import { clsx } from 'clsx';
import { HUE_SEGMENTS, SATURATION_RINGS, Guess, PLAYER_COLORS } from '@/lib/types';
import { hslToColor } from '@/lib/colors';

interface ColorGridProps {
  targetHue?: number | null;
  targetSaturation?: number | null;
  showTarget?: boolean;
  selectedHue?: number | null;
  selectedSaturation?: number | null;
  guesses?: Guess[];
  playerColorMap?: Map<string, number>;
  playerNameMap?: Map<string, string>;
  onCellClick?: (hue: number, saturation: number) => void;
  disabled?: boolean;
  highlightBestGuess?: boolean;
}

export default function ColorGrid({
  targetHue,
  targetSaturation,
  showTarget = false,
  selectedHue,
  selectedSaturation,
  guesses = [],
  playerColorMap = new Map(),
  playerNameMap = new Map(),
  onCellClick,
  disabled = false,
  highlightBestGuess = false,
}: ColorGridProps) {
  // Generate cells row by row (saturation rows, hue columns)
  const cells = useMemo(() => {
    const result: {
      hue: number;
      saturation: number;
      color: string;
    }[] = [];

    // Go from high saturation (top) to low saturation (bottom)
    for (let s = SATURATION_RINGS - 1; s >= 0; s--) {
      for (let h = 0; h < HUE_SEGMENTS; h++) {
        result.push({
          hue: h,
          saturation: s,
          color: hslToColor(h, s),
        });
      }
    }

    return result;
  }, []);

  // Group guesses by cell position
  const guessesByCell = useMemo(() => {
    const map = new Map<string, Guess[]>();
    for (const guess of guesses) {
      const key = `${guess.hue}-${guess.saturation}`;
      const existing = map.get(key) || [];
      existing.push(guess);
      map.set(key, existing);
    }
    return map;
  }, [guesses]);

  // Find best guesses per player
  const bestGuesses = useMemo(() => {
    if (!highlightBestGuess) return new Set<string>();

    const playerBestDistance = new Map<string, number>();
    const bestGuessKeys = new Set<string>();

    for (const guess of guesses) {
      if (guess.distance !== undefined) {
        const current = playerBestDistance.get(guess.playerId);
        if (current === undefined || guess.distance < current) {
          playerBestDistance.set(guess.playerId, guess.distance);
        }
      }
    }

    for (const guess of guesses) {
      if (guess.distance === playerBestDistance.get(guess.playerId)) {
        bestGuessKeys.add(`${guess.playerId}-${guess.guessNumber}`);
      }
    }

    return bestGuessKeys;
  }, [guesses, highlightBestGuess]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className="grid gap-0.5 rounded-lg overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${HUE_SEGMENTS}, 1fr)`,
        }}
      >
        {cells.map((cell) => {
          const isTarget =
            showTarget && cell.hue === targetHue && cell.saturation === targetSaturation;
          const isSelected =
            cell.hue === selectedHue && cell.saturation === selectedSaturation;
          const cellGuesses = guessesByCell.get(`${cell.hue}-${cell.saturation}`) || [];

          return (
            <div
              key={`${cell.hue}-${cell.saturation}`}
              className={clsx(
                'aspect-square relative transition-all duration-150',
                !disabled && onCellClick && 'cursor-pointer active:scale-95',
                isTarget && 'ring-2 ring-white ring-inset z-10',
                isSelected && 'ring-2 ring-black ring-inset z-10'
              )}
              style={{ backgroundColor: cell.color }}
              onClick={() => {
                if (!disabled && onCellClick) {
                  onCellClick(cell.hue, cell.saturation);
                }
              }}
            >
              {/* Player guess markers */}
              {cellGuesses.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  {cellGuesses.length === 1 ? (
                    // Single guess - show full marker
                    (() => {
                      const guess = cellGuesses[0];
                      const colorIndex = playerColorMap.get(guess.playerId) ?? 0;
                      const playerColor = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];
                      const isBest = bestGuesses.has(`${guess.playerId}-${guess.guessNumber}`);
                      const playerName = playerNameMap.get(guess.playerId) ?? '';
                      const initial = playerName.charAt(0).toUpperCase();

                      return (
                        <div
                          className={clsx(
                            'w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold border-2',
                            isBest ? 'border-yellow-400' : 'border-white',
                            guess.guessNumber === 2 && !isBest && 'border-dashed'
                          )}
                          style={{ backgroundColor: playerColor }}
                        >
                          {initial}
                        </div>
                      );
                    })()
                  ) : (
                    // Multiple guesses - show count
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold bg-black/70 border-2 border-white">
                      {cellGuesses.length}
                    </div>
                  )}
                </div>
              )}

              {/* Target indicator */}
              {isTarget && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3 h-3 rounded-full bg-white animate-ping" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
