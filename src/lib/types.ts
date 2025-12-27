export type GameState =
  | 'lobby'
  | 'clue-1'
  | 'guess-1'
  | 'clue-2'
  | 'guess-2'
  | 'reveal'
  | 'leaderboard'
  | 'finished';

export interface Guess {
  playerId: string;
  roundNumber: number;
  guessNumber: 1 | 2;
  hue: number; // 0-35
  saturation: number; // 0-7
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
  targetHue: number | null; // 0-35
  targetSaturation: number | null; // 0-7
  createdAt: number;
  lockedAt: number | null;
  phaseEndTime: number | null; // Timestamp when current phase ends
  players: Player[];
  guesses: Guess[];
  roundScores: { playerId: string; distance: number; points: number }[];
}

export interface GameAction {
  type: string;
  playerId?: string;
  gameId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
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

// Constants
export const HUE_SEGMENTS = 36;
export const SATURATION_RINGS = 8;
export const PHASE_DURATION = 30000; // 30 seconds in ms
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 24;
export const MAX_NAME_LENGTH = 16;
