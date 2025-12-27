export type GameState =
  | 'lobby'
  | 'clue-1'
  | 'guess-1'
  | 'clue-2'
  | 'guess-2'
  | 'reveal'
  | 'leaderboard'
  | 'finished';

export type GameMode = 'together' | 'remote';

export type ColorComplexity = 'simple' | 'normal' | 'complex';

export interface GameSettings {
  mode: GameMode;
  complexity: ColorComplexity;
  timerEnabled: boolean;
}

// Grid dimensions for each complexity level
export const COMPLEXITY_DIMENSIONS: Record<ColorComplexity, { hue: number; chroma: number }> = {
  simple: { hue: 12, chroma: 10 },   // 120 colors
  normal: { hue: 24, chroma: 20 },   // 480 colors
  complex: { hue: 36, chroma: 28 },  // 1008 colors
};

export const DEFAULT_SETTINGS: GameSettings = {
  mode: 'together',
  complexity: 'normal',
  timerEnabled: true,
};

export interface Guess {
  playerId: string;
  roundNumber: number;
  guessNumber: 1 | 2;
  hue: number; // 0-47 (HUE_SEGMENTS - 1)
  saturation: number; // 0-11 (CHROMA_LEVELS - 1) - actually chroma in OKLCH
  lockedIn: boolean;
  distance?: number; // Calculated at reveal
}

export interface Player {
  id: string;
  gameId: string;
  name: string;
  colorIndex: number; // For visual marker color
  totalScore: number;
  isConnected: boolean;
  joinedAt: number;
  lastSeen: number;
}

export interface Game {
  id: string;
  state: GameState;
  hostId: string;
  clueGiverId: string | null;
  roundNumber: number;
  targetHue: number | null; // Index within complexity dimensions
  targetSaturation: number | null; // Index within complexity dimensions
  createdAt: number;
  lockedAt: number | null;
  phaseEndTime: number | null; // Timestamp when current phase ends
  players: Player[];
  guesses: Guess[];
  roundScores: RoundScore[];
  settings: GameSettings;
  currentClue: string | null; // Text clue in remote mode
}

export type GameActionType =
  | 'create'
  | 'join'
  | 'leave'
  | 'start'
  | 'advance'
  | 'guess'
  | 'submitClue'
  | 'updateSettings'
  | 'end'
  | 'playAgain'
  | 'poll';

export interface RoundScore {
  playerId: string;
  distance: number;
  points: number;
  isClueGiver?: boolean;
}

// Player colors for markers (12 distinct colors)
export const PLAYER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Sky Blue
  '#96CEB4', // Sage
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#85C1E9', // Light Blue
  '#F8B500', // Orange
  '#58D68D', // Green
];

// Legacy constants - now use COMPLEXITY_DIMENSIONS based on game settings
export const HUE_SEGMENTS = 24; // Default to normal complexity
export const CHROMA_LEVELS = 20;
export const PHASE_DURATION = 30000; // 30 seconds in ms
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 24;
export const MAX_NAME_LENGTH = 16;

// Helper to get grid dimensions for a complexity level
export function getGridDimensions(complexity: ColorComplexity) {
  return COMPLEXITY_DIMENSIONS[complexity];
}
