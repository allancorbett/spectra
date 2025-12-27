import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import {
  Game,
  GameState,
  Player,
  PLAYER_COLORS,
  PHASE_DURATION,
  MIN_PLAYERS,
  MAX_PLAYERS,
  MAX_NAME_LENGTH,
} from './types';
import { calculateDistance, generateGameCode, getRandomTarget } from './colors';

// Game TTL: 24 hours in seconds
const GAME_TTL_SECONDS = 24 * 60 * 60;

// Redis client singleton
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    return redis;
  } catch {
    console.error('Failed to connect to Redis');
    return null;
  }
}

// In-memory fallback for local development
const memoryStore: Map<string, Game> = new Map();

// Key prefix for games
const gameKey = (gameId: string) => `game:${gameId.toUpperCase()}`;

// Get next clue-giver in sequential order (by join time)
function getNextClueGiver(game: Game): string {
  // Sort players by join time
  const sortedPlayers = [...game.players].sort((a, b) => a.joinedAt - b.joinedAt);

  // Find current clue-giver's index
  const currentIndex = sortedPlayers.findIndex((p) => p.id === game.clueGiverId);

  // Get next player (wrap around to start)
  const nextIndex = (currentIndex + 1) % sortedPlayers.length;
  return sortedPlayers[nextIndex].id;
}

// Storage abstraction
async function getGameFromStore(gameId: string): Promise<Game | null> {
  const client = getRedis();
  if (client) {
    try {
      const data = await client.get(gameKey(gameId));
      if (data) {
        return JSON.parse(data) as Game;
      }
      return null;
    } catch (err) {
      console.error('Redis get error:', err);
      return memoryStore.get(gameId.toUpperCase()) || null;
    }
  }
  return memoryStore.get(gameId.toUpperCase()) || null;
}

async function setGameInStore(game: Game): Promise<void> {
  const client = getRedis();
  if (client) {
    try {
      await client.setex(gameKey(game.id), GAME_TTL_SECONDS, JSON.stringify(game));
      return;
    } catch (err) {
      console.error('Redis set error:', err);
    }
  }
  memoryStore.set(game.id.toUpperCase(), game);
}

async function deleteGameFromStore(gameId: string): Promise<boolean> {
  const client = getRedis();
  if (client) {
    try {
      await client.del(gameKey(gameId));
      return true;
    } catch (err) {
      console.error('Redis del error:', err);
    }
  }
  return memoryStore.delete(gameId.toUpperCase());
}

export async function createGame(hostPlayerId: string): Promise<Game> {
  const gameId = generateGameCode();
  const now = Date.now();

  const game: Game = {
    id: gameId,
    state: 'lobby',
    hostId: hostPlayerId,
    clueGiverId: null,
    roundNumber: 0,
    targetHue: null,
    targetSaturation: null,
    createdAt: now,
    lockedAt: null,
    phaseEndTime: null,
    players: [],
    guesses: [],
    roundScores: [],
  };

  await setGameInStore(game);
  return game;
}

export async function getGame(gameId: string): Promise<Game | null> {
  return await getGameFromStore(gameId);
}

export async function getGameForPlayer(gameId: string, playerId: string): Promise<Game | null> {
  const game = await getGame(gameId);
  if (!game) return null;

  // Update player's last seen time
  const player = game.players.find((p) => p.id === playerId);
  if (player) {
    player.lastSeen = Date.now();
    player.isConnected = true;
    await setGameInStore(game);
  }

  return game;
}

export async function joinGame(
  gameId: string,
  playerId: string,
  name: string
): Promise<{ success: boolean; error?: string; game?: Game }> {
  const game = await getGame(gameId);
  if (!game) {
    return { success: false, error: 'Game not found' };
  }

  if (game.state !== 'lobby') {
    return { success: false, error: 'Game has already started' };
  }

  if (game.players.length >= MAX_PLAYERS) {
    return { success: false, error: 'Game is full' };
  }

  // Check if player already exists
  const existingPlayer = game.players.find((p) => p.id === playerId);
  if (existingPlayer) {
    existingPlayer.isConnected = true;
    existingPlayer.lastSeen = Date.now();
    await setGameInStore(game);
    return { success: true, game };
  }

  // Validate name
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { success: false, error: 'Name is required' };
  }
  if (trimmedName.length > MAX_NAME_LENGTH) {
    return { success: false, error: `Name must be ${MAX_NAME_LENGTH} characters or less` };
  }

  // Check for duplicate names
  if (game.players.some((p) => p.name.toLowerCase() === trimmedName.toLowerCase())) {
    return { success: false, error: 'Name already taken' };
  }

  const player: Player = {
    id: playerId,
    gameId,
    name: trimmedName,
    colorIndex: game.players.length % PLAYER_COLORS.length,
    totalScore: 0,
    isConnected: true,
    joinedAt: Date.now(),
    lastSeen: Date.now(),
  };

  game.players.push(player);
  await setGameInStore(game);
  return { success: true, game };
}

export async function leaveGame(gameId: string, playerId: string): Promise<Game | null> {
  const game = await getGame(gameId);
  if (!game) return null;

  if (game.state === 'lobby') {
    // Remove player from lobby
    game.players = game.players.filter((p) => p.id !== playerId);

    // If host left and there are other players, assign new host
    if (playerId === game.hostId && game.players.length > 0) {
      game.hostId = game.players[0].id;
    }

    // Delete game if empty
    if (game.players.length === 0) {
      await deleteGameFromStore(gameId);
      return null;
    }
  } else {
    // Mark player as disconnected during game
    const player = game.players.find((p) => p.id === playerId);
    if (player) {
      player.isConnected = false;
    }
  }

  await setGameInStore(game);
  return game;
}

export async function startGame(gameId: string, playerId: string): Promise<{ success: boolean; error?: string; game?: Game }> {
  const game = await getGame(gameId);
  if (!game) {
    return { success: false, error: 'Game not found' };
  }

  if (game.hostId !== playerId) {
    return { success: false, error: 'Only the host can start the game' };
  }

  if (game.players.length < MIN_PLAYERS) {
    return { success: false, error: `Need at least ${MIN_PLAYERS} players to start` };
  }

  if (game.state !== 'lobby') {
    return { success: false, error: 'Game has already started' };
  }

  // Lock the game and start first round
  game.lockedAt = Date.now();
  game.clueGiverId = game.hostId;
  startNewRound(game);

  await setGameInStore(game);
  return { success: true, game };
}

function startNewRound(game: Game) {
  game.roundNumber++;
  const target = getRandomTarget();
  game.targetHue = target.hue;
  game.targetSaturation = target.saturation;
  game.state = 'clue-1';
  game.phaseEndTime = Date.now() + PHASE_DURATION;
  game.roundScores = [];
  // Clear guesses for this round (keep previous rounds for history if needed)
  game.guesses = game.guesses.filter((g) => g.roundNumber !== game.roundNumber);
}

export async function advancePhase(
  gameId: string,
  playerId: string
): Promise<{ success: boolean; error?: string; game?: Game }> {
  const game = await getGame(gameId);
  if (!game) {
    return { success: false, error: 'Game not found' };
  }

  const transitions: Record<GameState, GameState | null> = {
    lobby: null,
    'clue-1': 'guess-1',
    'guess-1': 'clue-2',
    'clue-2': 'guess-2',
    'guess-2': 'reveal',
    reveal: 'leaderboard',
    leaderboard: 'clue-1', // Start next round
    finished: null,
  };

  // Only clue-giver can advance clue phases and reveal
  if (['clue-1', 'clue-2', 'reveal', 'leaderboard'].includes(game.state)) {
    if (game.clueGiverId !== playerId) {
      return { success: false, error: 'Only the clue-giver can advance' };
    }
  }

  const nextState = transitions[game.state];
  if (!nextState) {
    return { success: false, error: 'Cannot advance from this state' };
  }

  // Special handling for reveal phase - calculate scores
  if (game.state === 'guess-2' && nextState === 'reveal') {
    calculateRoundScores(game);
    // Rotate to next clue-giver in join order
    game.clueGiverId = getNextClueGiver(game);
  }

  // Start new round if coming from leaderboard
  if (game.state === 'leaderboard' && nextState === 'clue-1') {
    startNewRound(game);
    await setGameInStore(game);
    return { success: true, game };
  }

  game.state = nextState;
  game.phaseEndTime = ['guess-1', 'guess-2', 'clue-1', 'clue-2'].includes(nextState)
    ? Date.now() + PHASE_DURATION
    : null;

  await setGameInStore(game);
  return { success: true, game };
}

export async function submitGuess(
  gameId: string,
  playerId: string,
  hue: number,
  saturation: number,
  lockIn: boolean
): Promise<{ success: boolean; error?: string; game?: Game }> {
  const game = await getGame(gameId);
  if (!game) {
    return { success: false, error: 'Game not found' };
  }

  const player = game.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not in game' };
  }

  if (playerId === game.clueGiverId) {
    return { success: false, error: 'Clue-giver cannot guess' };
  }

  const guessNumber = game.state === 'guess-1' ? 1 : game.state === 'guess-2' ? 2 : null;
  if (!guessNumber) {
    return { success: false, error: 'Not in a guess phase' };
  }

  // Find existing guess or create new one
  let guess = game.guesses.find(
    (g) => g.playerId === playerId && g.roundNumber === game.roundNumber && g.guessNumber === guessNumber
  );

  if (guess?.lockedIn) {
    return { success: false, error: 'Guess already locked in' };
  }

  if (!guess) {
    guess = {
      playerId,
      roundNumber: game.roundNumber,
      guessNumber: guessNumber as 1 | 2,
      hue,
      saturation,
      lockedIn: false,
    };
    game.guesses.push(guess);
  } else {
    guess.hue = hue;
    guess.saturation = saturation;
  }

  if (lockIn) {
    guess.lockedIn = true;
  }

  // Check if all guessers have locked in
  if (lockIn) {
    const guessers = game.players.filter((p) => p.id !== game.clueGiverId && p.isConnected);
    const lockedGuesses = game.guesses.filter(
      (g) => g.roundNumber === game.roundNumber && g.guessNumber === guessNumber && g.lockedIn
    );

    if (lockedGuesses.length >= guessers.length) {
      // All locked in, auto-advance
      const nextState = game.state === 'guess-1' ? 'clue-2' : 'reveal';
      if (nextState === 'reveal') {
        calculateRoundScores(game);
        // Rotate to next clue-giver in join order
        game.clueGiverId = getNextClueGiver(game);
      }
      game.state = nextState as GameState;
      game.phaseEndTime = nextState === 'clue-2' ? Date.now() + PHASE_DURATION : null;
    }
  }

  await setGameInStore(game);
  return { success: true, game };
}

function calculateRoundScores(game: Game) {
  if (game.targetHue === null || game.targetSaturation === null) return;

  const scores: { playerId: string; distance: number; points: number; isClueGiver?: boolean }[] = [];
  const guessers = game.players.filter((p) => p.id !== game.clueGiverId);
  const clueGiver = game.players.find((p) => p.id === game.clueGiverId);

  for (const player of guessers) {
    const playerGuesses = game.guesses.filter(
      (g) => g.playerId === player.id && g.roundNumber === game.roundNumber
    );

    if (playerGuesses.length === 0) {
      // No guesses = max points (100)
      scores.push({ playerId: player.id, distance: 100, points: 100 });
      player.totalScore += 100;
      continue;
    }

    // Calculate distance for each guess
    let bestDistance = 100;
    for (const guess of playerGuesses) {
      const distance = calculateDistance(
        game.targetHue,
        game.targetSaturation,
        guess.hue,
        guess.saturation
      );
      guess.distance = distance;
      if (distance < bestDistance) {
        bestDistance = distance;
      }
    }

    scores.push({ playerId: player.id, distance: bestDistance, points: bestDistance });
    player.totalScore += bestDistance;
  }

  // Calculate clue-giver's score as the average of all guesser scores
  if (clueGiver && scores.length > 0) {
    const totalPoints = scores.reduce((sum, s) => sum + s.points, 0);
    const averagePoints = Math.round(totalPoints / scores.length);
    scores.push({
      playerId: clueGiver.id,
      distance: averagePoints,
      points: averagePoints,
      isClueGiver: true
    });
    clueGiver.totalScore += averagePoints;
  }

  // Sort by distance (lowest first)
  scores.sort((a, b) => a.distance - b.distance);
  game.roundScores = scores;
}

export async function endGame(gameId: string, playerId: string): Promise<{ success: boolean; error?: string; game?: Game }> {
  const game = await getGame(gameId);
  if (!game) {
    return { success: false, error: 'Game not found' };
  }

  if (game.clueGiverId !== playerId) {
    return { success: false, error: 'Only the current clue-giver can end the game' };
  }

  if (game.state !== 'leaderboard') {
    return { success: false, error: 'Can only end game from leaderboard' };
  }

  game.state = 'finished';
  game.phaseEndTime = null;

  await setGameInStore(game);
  return { success: true, game };
}

export async function playAgain(gameId: string, playerId: string): Promise<{ success: boolean; error?: string; game?: Game }> {
  const game = await getGame(gameId);
  if (!game) {
    return { success: false, error: 'Game not found' };
  }

  if (game.state !== 'finished') {
    return { success: false, error: 'Game is not finished' };
  }

  // Find original host (first player who joined)
  const originalHost = game.players.reduce((oldest, p) =>
    p.joinedAt < oldest.joinedAt ? p : oldest
  );

  // Reset scores and game state
  for (const player of game.players) {
    player.totalScore = 0;
  }
  game.roundNumber = 0;
  game.targetHue = null;
  game.targetSaturation = null;
  game.guesses = [];
  game.roundScores = [];
  game.hostId = originalHost.id;
  game.clueGiverId = null;
  game.lockedAt = null;
  game.state = 'lobby';
  game.phaseEndTime = null;

  await setGameInStore(game);
  return { success: true, game };
}

export async function checkAndAdvancePhase(gameId: string): Promise<Game | null> {
  const game = await getGame(gameId);
  if (!game) return null;

  let updated = false;

  // Auto-advance if phase timer expired
  if (game.phaseEndTime && Date.now() >= game.phaseEndTime) {
    if (game.state === 'guess-1') {
      // Lock in any placed guesses
      lockUnlockedGuesses(game, 1);
      game.state = 'clue-2';
      game.phaseEndTime = Date.now() + PHASE_DURATION;
      updated = true;
    } else if (game.state === 'guess-2') {
      // Lock in any placed guesses and reveal
      lockUnlockedGuesses(game, 2);
      calculateRoundScores(game);
      // Rotate to next clue-giver in join order
      game.clueGiverId = getNextClueGiver(game);
      game.state = 'reveal';
      game.phaseEndTime = null;
      updated = true;
    } else if (game.state === 'clue-1' || game.state === 'clue-2') {
      // Auto-advance clue phases if timer expires
      const nextState = game.state === 'clue-1' ? 'guess-1' : 'guess-2';
      game.state = nextState;
      game.phaseEndTime = Date.now() + PHASE_DURATION;
      updated = true;
    }
  }

  if (updated) {
    await setGameInStore(game);
  }

  return game;
}

function lockUnlockedGuesses(game: Game, guessNumber: 1 | 2) {
  for (const guess of game.guesses) {
    if (guess.roundNumber === game.roundNumber && guess.guessNumber === guessNumber && !guess.lockedIn) {
      guess.lockedIn = true;
    }
  }
}

export async function deleteGame(gameId: string): Promise<boolean> {
  return await deleteGameFromStore(gameId);
}

// Get player ID from localStorage key
export function createPlayerId(): string {
  return uuidv4();
}
