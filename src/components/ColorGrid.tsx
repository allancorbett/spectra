'use client';

import { useMemo } from 'react';
import { clsx } from 'clsx';
import { HUE_SEGMENTS, CHROMA_LEVELS, Guess, PLAYER_COLORS } from '@/lib/types';
import { indexToColor } from '@/lib/colors';

// Cell size in pixels - makes cells easy to tap
const CELL_SIZE = 32;
const GAP_SIZE = 2;

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
  // Generate all cells
  const cells = useMemo(() => {
    const result: {
      hue: number;
      chroma: number;
      color: string;
    }[] = [];

    // Go from high chroma (top) to low chroma (bottom)
    for (let c = CHROMA_LEVELS - 1; c >= 0; c--) {
      for (let h = 0; h < HUE_SEGMENTS; h++) {
        result.push({
          hue: h,
          chroma: c,
          color: indexToColor(h, c),
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

  // Grid dimensions (cells + gaps)
  const gridWidth = HUE_SEGMENTS * CELL_SIZE + (HUE_SEGMENTS - 1) * GAP_SIZE;
  const gridHeight = CHROMA_LEVELS * CELL_SIZE + (CHROMA_LEVELS - 1) * GAP_SIZE;

  return (
    <div className="w-full">
      {/* Scroll hint */}
      <p className="text-xs text-center text-foreground/40 mb-2">
        Scroll to explore colors
      </p>

      {/* Scrollable container */}
      <div
        className="overflow-auto rounded-xl"
        style={{ height: '70dvh', maxHeight: '800px' }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${HUE_SEGMENTS}, ${CELL_SIZE}px)`,
            gap: GAP_SIZE,
            width: gridWidth,
            height: gridHeight,
          }}
        >
          {cells.map((cell) => {
            const isTarget =
              showTarget && cell.hue === targetHue && cell.chroma === targetSaturation;
            const isSelected =
              cell.hue === selectedHue && cell.chroma === selectedSaturation;
            const cellGuesses = guessesByCell.get(`${cell.hue}-${cell.chroma}`) || [];

            return (
              <div
                key={`${cell.hue}-${cell.chroma}`}
                className={clsx(
                  'relative transition-all duration-100',
                  !disabled && onCellClick && 'cursor-pointer active:opacity-80',
                  isTarget && 'ring-2 ring-white ring-inset z-10',
                  isSelected && 'ring-2 ring-white ring-inset z-20'
                )}
                style={{
                  backgroundColor: cell.color,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                }}
                onClick={() => {
                  if (!disabled && onCellClick) {
                    onCellClick(cell.hue, cell.chroma);
                  }
                }}
              >
                {/* Player guess markers */}
                {cellGuesses.length > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {cellGuesses.length === 1 ? (
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
                              'w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold border',
                              isBest ? 'border-yellow-400 border-2' : 'border-white',
                              guess.guessNumber === 2 && !isBest && 'border-dashed'
                            )}
                            style={{ backgroundColor: playerColor }}
                          >
                            {initial}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold bg-black/70 border border-white">
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

                {/* Selection checkmark */}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg className="w-5 h-5 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
