import { HUE_SEGMENTS, CHROMA_LEVELS, ColorComplexity, getGridDimensions } from './types';

/**
 * Convert grid indices to OKLCH CSS color string
 * Uses OKLCH for perceptually uniform brightness
 *
 * Hue: 0 to hueSegments-1 (mapped to 0-360 degrees)
 * Chroma: 0 to chromaLevels-1 (mapped to 0.13-0.25 for vivid, saturated colors)
 * Lightness: Fixed at 0.65 for uniform perceived brightness
 */
export function indexToColor(
  hueIndex: number,
  chromaIndex: number,
  hueSegments: number = HUE_SEGMENTS,
  chromaLevels: number = CHROMA_LEVELS
): string {
  const hue = (hueIndex / hueSegments) * 360;
  // Chroma ranges from 0.13 to 0.25 (all vivid, saturated colors)
  const chroma = 0.13 + (chromaIndex / (chromaLevels - 1)) * 0.12;
  const lightness = 0.65;
  return `oklch(${lightness} ${chroma} ${hue})`;
}

/**
 * Calculate Euclidean distance between two cells on the color grid
 * Returns a score from 0-100 (lower is better)
 */
export function calculateDistance(
  targetHue: number,
  targetSat: number,
  guessHue: number,
  guessSat: number,
  hueSegments: number = HUE_SEGMENTS,
  chromaLevels: number = CHROMA_LEVELS
): number {
  // Calculate hue distance (shortest arc, wrapping at hueSegments)
  let hueDiff = Math.abs(targetHue - guessHue);
  if (hueDiff > hueSegments / 2) {
    hueDiff = hueSegments - hueDiff;
  }
  // Normalize hue distance to 0-1 scale (max distance is half the segments)
  const normalizedHueDist = hueDiff / (hueSegments / 2);

  // Calculate chroma distance
  const satDiff = Math.abs(targetSat - guessSat);
  const normalizedSatDist = satDiff / (chromaLevels - 1);

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
 * Get a random target cell for a given complexity level
 */
export function getRandomTarget(complexity: ColorComplexity = 'normal'): { hue: number; saturation: number } {
  const dims = getGridDimensions(complexity);
  return {
    hue: Math.floor(Math.random() * dims.hue),
    saturation: Math.floor(Math.random() * dims.chroma),
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
