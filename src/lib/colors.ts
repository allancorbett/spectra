import { HUE_SEGMENTS, SATURATION_RINGS } from './types';

/**
 * Convert HSL to CSS color string
 * Hue: 0-35 (mapped to 0-360)
 * Saturation: 0-7 (mapped to ~20-100%)
 * Lightness: Fixed at 50%
 */
export function hslToColor(hueIndex: number, saturationIndex: number): string {
  const hue = (hueIndex / HUE_SEGMENTS) * 360;
  // Saturation ranges from 20% (center) to 100% (edge)
  const saturation = 20 + (saturationIndex / (SATURATION_RINGS - 1)) * 80;
  return `hsl(${hue}, ${saturation}%, 50%)`;
}

/**
 * Calculate Euclidean distance between two cells on the color wheel
 * Returns a score from 0-100 (lower is better)
 */
export function calculateDistance(
  targetHue: number,
  targetSat: number,
  guessHue: number,
  guessSat: number
): number {
  // Calculate hue distance (shortest arc, wrapping at 36)
  let hueDiff = Math.abs(targetHue - guessHue);
  if (hueDiff > HUE_SEGMENTS / 2) {
    hueDiff = HUE_SEGMENTS - hueDiff;
  }
  // Normalize hue distance to 0-1 scale (max distance is 18 segments)
  const normalizedHueDist = hueDiff / (HUE_SEGMENTS / 2);

  // Calculate saturation distance (0-7, so max diff is 7)
  const satDiff = Math.abs(targetSat - guessSat);
  const normalizedSatDist = satDiff / (SATURATION_RINGS - 1);

  // Euclidean distance in normalized space
  const euclidean = Math.sqrt(
    normalizedHueDist * normalizedHueDist + normalizedSatDist * normalizedSatDist
  );

  // Scale to 0-100 (max euclidean in this space is sqrt(2) ≈ 1.414)
  const maxDistance = Math.sqrt(2);
  const score = Math.round((euclidean / maxDistance) * 100);

  return Math.min(100, score);
}

/**
 * Get a random target cell
 */
export function getRandomTarget(): { hue: number; saturation: number } {
  return {
    hue: Math.floor(Math.random() * HUE_SEGMENTS),
    saturation: Math.floor(Math.random() * SATURATION_RINGS),
  };
}

/**
 * Generate a short game code (6 characters, alphanumeric)
 */
export function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded I, O, 0, 1 for clarity
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
