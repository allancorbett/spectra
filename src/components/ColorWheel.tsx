'use client';

import { useMemo } from 'react';
import { clsx } from 'clsx';
import { Guess, PLAYER_COLORS, ColorComplexity, getGridDimensions } from '@/lib/types';
import { indexToColor } from '@/lib/colors';

interface ColorWheelProps {
  size?: number;
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
  complexity?: ColorComplexity;
}

export default function ColorWheel({
  size = 320,
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
  complexity = 'normal',
}: ColorWheelProps) {
  // Get grid dimensions based on complexity
  const dims = getGridDimensions(complexity);
  const hueSegments = dims.hue;
  const chromaLevels = dims.chroma;

  const centerX = size / 2;
  const centerY = size / 2;
  const innerRadius = size * 0.08; // Empty center
  const outerRadius = size * 0.48;
  const ringWidth = (outerRadius - innerRadius) / chromaLevels;

  // Generate cell paths
  const cells = useMemo(() => {
    const result: {
      hue: number;
      saturation: number;
      path: string;
      color: string;
    }[] = [];

    for (let h = 0; h < hueSegments; h++) {
      for (let s = 0; s < chromaLevels; s++) {
        const startAngle = (h / hueSegments) * 360 - 90; // Start at top
        const endAngle = ((h + 1) / hueSegments) * 360 - 90;
        const innerR = innerRadius + s * ringWidth;
        const outerR = innerRadius + (s + 1) * ringWidth;

        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = centerX + innerR * Math.cos(startRad);
        const y1 = centerY + innerR * Math.sin(startRad);
        const x2 = centerX + outerR * Math.cos(startRad);
        const y2 = centerY + outerR * Math.sin(startRad);
        const x3 = centerX + outerR * Math.cos(endRad);
        const y3 = centerY + outerR * Math.sin(endRad);
        const x4 = centerX + innerR * Math.cos(endRad);
        const y4 = centerY + innerR * Math.sin(endRad);

        const path = `
          M ${x1} ${y1}
          L ${x2} ${y2}
          A ${outerR} ${outerR} 0 0 1 ${x3} ${y3}
          L ${x4} ${y4}
          A ${innerR} ${innerR} 0 0 0 ${x1} ${y1}
          Z
        `;

        result.push({
          hue: h,
          saturation: s,
          path,
          color: indexToColor(h, s, hueSegments, chromaLevels),
        });
      }
    }

    return result;
  }, [centerX, centerY, innerRadius, ringWidth, hueSegments, chromaLevels]);

  // Get position for a cell (for markers)
  const getCellPosition = (hue: number, saturation: number) => {
    const angle = ((hue + 0.5) / hueSegments) * 360 - 90;
    const radius = innerRadius + (saturation + 0.5) * ringWidth;
    const rad = (angle * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(rad),
      y: centerY + radius * Math.sin(rad),
    };
  };

  // Group guesses by player to find best guesses
  const bestGuesses = useMemo(() => {
    if (!highlightBestGuess) return new Set<string>();

    const playerBestDistance = new Map<string, number>();
    const bestGuessKeys = new Set<string>();

    // First pass: find best distance for each player
    for (const guess of guesses) {
      if (guess.distance !== undefined) {
        const current = playerBestDistance.get(guess.playerId);
        if (current === undefined || guess.distance < current) {
          playerBestDistance.set(guess.playerId, guess.distance);
        }
      }
    }

    // Second pass: mark best guesses
    for (const guess of guesses) {
      if (guess.distance === playerBestDistance.get(guess.playerId)) {
        bestGuessKeys.add(`${guess.playerId}-${guess.guessNumber}`);
      }
    }

    return bestGuessKeys;
  }, [guesses, highlightBestGuess]);

  return (
    <div className="relative inline-block">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="drop-shadow-lg"
      >
        {/* Cells */}
        {cells.map((cell) => {
          const isTarget =
            showTarget && cell.hue === targetHue && cell.saturation === targetSaturation;
          const isSelected =
            cell.hue === selectedHue && cell.saturation === selectedSaturation;

          return (
            <path
              key={`${cell.hue}-${cell.saturation}`}
              d={cell.path}
              fill={cell.color}
              stroke={isTarget ? '#fff' : isSelected ? '#000' : 'rgba(0,0,0,0.1)'}
              strokeWidth={isTarget ? 3 : isSelected ? 2 : 0.5}
              className={clsx(
                'transition-all duration-150',
                !disabled && onCellClick && 'cursor-pointer hover:opacity-80',
                isTarget && 'animate-pulse'
              )}
              onClick={() => {
                if (!disabled && onCellClick) {
                  onCellClick(cell.hue, cell.saturation);
                }
              }}
            />
          );
        })}

        {/* Target marker */}
        {showTarget && targetHue != null && targetSaturation != null && (
          <>
            {(() => {
              const pos = getCellPosition(targetHue as number, targetSaturation as number);
              return (
                <g>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={ringWidth * 0.6}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={3}
                    className="animate-pulse"
                  />
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={ringWidth * 0.6}
                    fill="none"
                    stroke="#000"
                    strokeWidth={1}
                  />
                </g>
              );
            })()}
          </>
        )}

        {/* Player guess markers */}
        {guesses.map((guess) => {
          const pos = getCellPosition(guess.hue, guess.saturation);
          const colorIndex = playerColorMap.get(guess.playerId) ?? 0;
          const playerColor = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];
          const isBest = bestGuesses.has(`${guess.playerId}-${guess.guessNumber}`);
          const playerName = playerNameMap.get(guess.playerId) ?? '';
          const initial = playerName.charAt(0).toUpperCase();

          return (
            <g key={`${guess.playerId}-${guess.guessNumber}`}>
              {/* Outer ring for second guess or best guess */}
              {(guess.guessNumber === 2 || isBest) && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={ringWidth * 0.45}
                  fill="none"
                  stroke={isBest ? '#FFD700' : playerColor}
                  strokeWidth={isBest ? 3 : 2}
                  strokeDasharray={guess.guessNumber === 2 && !isBest ? '4 2' : undefined}
                />
              )}
              {/* Main marker */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={ringWidth * 0.35}
                fill={playerColor}
                stroke="#fff"
                strokeWidth={2}
                className={clsx(
                  guess.lockedIn ? 'opacity-100' : 'opacity-70'
                )}
              />
              {/* Player initial */}
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#fff"
                fontSize={ringWidth * 0.35}
                fontWeight="bold"
                className="pointer-events-none select-none"
              >
                {initial}
              </text>
            </g>
          );
        })}

        {/* Selection indicator */}
        {selectedHue != null && selectedSaturation != null && (
          (() => {
            const pos = getCellPosition(selectedHue as number, selectedSaturation as number);
            return (
              <circle
                cx={pos.x}
                cy={pos.y}
                r={ringWidth * 0.5}
                fill="none"
                stroke="#000"
                strokeWidth={3}
                strokeDasharray="6 3"
              />
            );
          })()
        )}
      </svg>
    </div>
  );
}
