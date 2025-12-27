'use client';

import { useMemo, useState, useRef, useCallback } from 'react';
import { clsx } from 'clsx';
import { HUE_SEGMENTS, CHROMA_LEVELS, Guess, PLAYER_COLORS } from '@/lib/types';
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
  const [scale, setScale] = useState(2); // Start zoomed in for bigger cells
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastTouchRef = useRef<{ x: number; y: number; dist: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
          color: hslToColor(h, c),
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

  // Touch handlers for zoom and pan
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      lastTouchRef.current = { x: midX, y: midY, dist };
      setIsDragging(true);
    } else if (e.touches.length === 1) {
      // Pan start
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 };
      setIsDragging(true);
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!lastTouchRef.current) return;

    if (e.touches.length === 2) {
      // Pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scaleDelta = dist / lastTouchRef.current.dist;

      setScale(s => Math.min(3, Math.max(1, s * scaleDelta)));

      // Update for next move
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      lastTouchRef.current = { x: midX, y: midY, dist };
    } else if (e.touches.length === 1) {
      // Pan
      const deltaX = e.touches[0].clientX - lastTouchRef.current.x;
      const deltaY = e.touches[0].clientY - lastTouchRef.current.y;

      // Limit panning based on scale
      const maxPan = 150 * (scale - 1);
      setPosition(p => ({
        x: Math.max(-maxPan, Math.min(maxPan, p.x + deltaX)),
        y: Math.max(-maxPan, Math.min(maxPan, p.y + deltaY)),
      }));

      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 };
    }
  }, [scale]);

  const handleTouchEnd = useCallback(() => {
    lastTouchRef.current = null;
    setIsDragging(false);

    // Reset position when zooming back to 1
    if (scale <= 1.1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  // Double tap to toggle zoom (between 1x and 2x)
  const lastTapRef = useRef<number>(0);
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected - toggle between 1x and 2x
      if (scale >= 2) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else {
        setScale(2);
        setPosition({ x: 0, y: 0 });
      }
    }
    lastTapRef.current = now;
  }, [scale]);

  return (
    <div className="w-full max-w-lg mx-auto px-2">
      {/* Zoom hint */}
      <p className="text-xs text-center text-foreground/40 mb-2">
        Drag to pan • Pinch to zoom • Double-tap to zoom out
      </p>

      <div
        ref={containerRef}
        className="overflow-hidden rounded-xl touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="grid gap-px transition-transform duration-100"
          style={{
            gridTemplateColumns: `repeat(${HUE_SEGMENTS}, 1fr)`,
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: 'center center',
          }}
          onClick={handleDoubleTap}
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
                  'aspect-square relative transition-all duration-100',
                  !disabled && onCellClick && !isDragging && 'cursor-pointer active:opacity-80',
                  isTarget && 'ring-2 ring-white ring-inset z-10',
                  isSelected && 'ring-2 ring-white ring-inset z-20'
                )}
                style={{ backgroundColor: cell.color }}
                onClick={(e) => {
                  if (!disabled && onCellClick && !isDragging) {
                    e.stopPropagation();
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
                              'w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold border',
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
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold bg-black/70 border border-white">
                        {cellGuesses.length}
                      </div>
                    )}
                  </div>
                )}

                {/* Target indicator */}
                {isTarget && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                  </div>
                )}

                {/* Selection checkmark */}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg className="w-4 h-4 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Zoom level indicator */}
      {scale > 1 && (
        <p className="text-xs text-center text-foreground/60 mt-2">
          {Math.round(scale * 100)}% - drag to pan
        </p>
      )}
    </div>
  );
}
