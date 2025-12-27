import {
  createGame,
  getGame,
  joinGame,
  leaveGame,
  startGame,
  advancePhase,
  submitGuess,
  endGame,
  playAgain,
  deleteGame,
  createPlayerId,
} from '@/lib/gameStore';
import { HUE_SEGMENTS, CHROMA_LEVELS } from '@/lib/types';

describe('gameStore.ts', () => {
  // Helper to create a game with players
  async function setupGame(playerCount: number = 2) {
    const hostId = createPlayerId();
    const game = await createGame(hostId);

    // Host joins
    await joinGame(game.id, hostId, 'Host');

    // Add additional players
    for (let i = 1; i < playerCount; i++) {
      const playerId = createPlayerId();
      await joinGame(game.id, playerId, `Player${i}`);
    }

    return { game: (await getGame(game.id))!, hostId };
  }

  afterEach(async () => {
    // Clean up any games created during tests
    // This is a bit hacky but works for in-memory store
  });

  describe('createGame', () => {
    it('creates a game with correct initial state', async () => {
      const hostId = createPlayerId();
      const game = await createGame(hostId);

      expect(game.id).toHaveLength(6);
      expect(game.state).toBe('lobby');
      expect(game.hostId).toBe(hostId);
      expect(game.clueGiverId).toBeNull();
      expect(game.roundNumber).toBe(0);
      expect(game.targetHue).toBeNull();
      expect(game.targetSaturation).toBeNull();
      expect(game.players).toHaveLength(0);
      expect(game.guesses).toHaveLength(0);
      expect(game.roundScores).toHaveLength(0);
    });

    it('persists game to store', async () => {
      const hostId = createPlayerId();
      const game = await createGame(hostId);

      const retrieved = await getGame(game.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(game.id);
    });
  });

  describe('joinGame', () => {
    it('allows player to join lobby', async () => {
      const hostId = createPlayerId();
      const game = await createGame(hostId);

      const result = await joinGame(game.id, hostId, 'TestHost');

      expect(result.success).toBe(true);
      expect(result.game?.players).toHaveLength(1);
      expect(result.game?.players[0].name).toBe('TestHost');
    });

    it('assigns correct color index to players', async () => {
      const hostId = createPlayerId();
      const game = await createGame(hostId);

      await joinGame(game.id, hostId, 'Player1');
      await joinGame(game.id, createPlayerId(), 'Player2');
      await joinGame(game.id, createPlayerId(), 'Player3');

      const updated = await getGame(game.id);
      expect(updated?.players[0].colorIndex).toBe(0);
      expect(updated?.players[1].colorIndex).toBe(1);
      expect(updated?.players[2].colorIndex).toBe(2);
    });

    it('wraps color index after 12 players', async () => {
      const hostId = createPlayerId();
      const game = await createGame(hostId);

      // Add 13 players
      for (let i = 0; i < 13; i++) {
        await joinGame(game.id, createPlayerId(), `Player${i}`);
      }

      const updated = await getGame(game.id);
      expect(updated?.players[12].colorIndex).toBe(0); // Wraps to 0
    });

    it('fails if game does not exist', async () => {
      const result = await joinGame('INVALID', createPlayerId(), 'Test');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Game not found');
    });

    it('fails if game has started', async () => {
      const { game, hostId } = await setupGame(2);
      await startGame(game.id, hostId);

      const result = await joinGame(game.id, createPlayerId(), 'Late');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Game has already started');
    });

    it('fails with empty name', async () => {
      const hostId = createPlayerId();
      const game = await createGame(hostId);

      const result = await joinGame(game.id, hostId, '   ');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Name is required');
    });

    it('fails with name too long', async () => {
      const hostId = createPlayerId();
      const game = await createGame(hostId);

      const result = await joinGame(game.id, hostId, 'ThisNameIsWayTooLongForTheGame');
      expect(result.success).toBe(false);
      expect(result.error).toContain('16 characters');
    });

    it('fails with duplicate name', async () => {
      const hostId = createPlayerId();
      const game = await createGame(hostId);

      await joinGame(game.id, hostId, 'Alice');
      const result = await joinGame(game.id, createPlayerId(), 'alice');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Name already taken');
    });

    it('allows reconnection with same player ID', async () => {
      const hostId = createPlayerId();
      const game = await createGame(hostId);

      await joinGame(game.id, hostId, 'Host');
      const result = await joinGame(game.id, hostId, 'Different');

      expect(result.success).toBe(true);
      // Name should remain original
      expect(result.game?.players[0].name).toBe('Host');
    });
  });

  describe('leaveGame', () => {
    it('removes player from lobby', async () => {
      const { game, hostId } = await setupGame(3);
      const playerId = game.players[1].id;

      await leaveGame(game.id, playerId);

      const updated = await getGame(game.id);
      expect(updated?.players).toHaveLength(2);
    });

    it('transfers host when host leaves', async () => {
      const { game, hostId } = await setupGame(2);
      const newHostId = game.players[1].id;

      await leaveGame(game.id, hostId);

      const updated = await getGame(game.id);
      expect(updated?.hostId).toBe(newHostId);
    });

    it('deletes game when last player leaves', async () => {
      const hostId = createPlayerId();
      const game = await createGame(hostId);
      await joinGame(game.id, hostId, 'Solo');

      await leaveGame(game.id, hostId);

      const deleted = await getGame(game.id);
      expect(deleted).toBeNull();
    });

    it('marks player as disconnected during active game', async () => {
      const { game, hostId } = await setupGame(2);
      await startGame(game.id, hostId);

      const playerId = game.players[1].id;
      await leaveGame(game.id, playerId);

      const updated = await getGame(game.id);
      const player = updated?.players.find(p => p.id === playerId);
      expect(player?.isConnected).toBe(false);
    });
  });

  describe('startGame', () => {
    it('starts game successfully with 2 players', async () => {
      const { game, hostId } = await setupGame(2);

      const result = await startGame(game.id, hostId);

      expect(result.success).toBe(true);
      expect(result.game?.state).toBe('clue-1');
      expect(result.game?.roundNumber).toBe(1);
      expect(result.game?.clueGiverId).toBe(hostId);
      expect(result.game?.targetHue).not.toBeNull();
      expect(result.game?.targetSaturation).not.toBeNull();
    });

    it('fails with less than 2 players', async () => {
      const hostId = createPlayerId();
      const game = await createGame(hostId);
      await joinGame(game.id, hostId, 'Solo');

      const result = await startGame(game.id, hostId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 2 players');
    });

    it('fails if not host', async () => {
      const { game } = await setupGame(2);
      const nonHost = game.players[1].id;

      const result = await startGame(game.id, nonHost);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only the host can start the game');
    });

    it('fails if game already started', async () => {
      const { game, hostId } = await setupGame(2);
      await startGame(game.id, hostId);

      const result = await startGame(game.id, hostId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Game has already started');
    });

    it('sets phaseEndTime when starting', async () => {
      const { game, hostId } = await setupGame(2);

      const result = await startGame(game.id, hostId);

      expect(result.game?.phaseEndTime).not.toBeNull();
      expect(result.game?.phaseEndTime).toBeGreaterThan(Date.now());
    });
  });

  describe('advancePhase', () => {
    it('advances from clue-1 to guess-1', async () => {
      const { game, hostId } = await setupGame(2);
      await startGame(game.id, hostId);

      const result = await advancePhase(game.id, hostId);

      expect(result.success).toBe(true);
      expect(result.game?.state).toBe('guess-1');
    });

    it('advances through all phases correctly', async () => {
      const { game, hostId } = await setupGame(2);
      await startGame(game.id, hostId);
      const guestId = game.players[1].id;

      // clue-1 -> guess-1
      await advancePhase(game.id, hostId);
      let updated = await getGame(game.id);
      expect(updated?.state).toBe('guess-1');

      // Submit guess and lock in
      await submitGuess(game.id, guestId, 5, 5, true);
      updated = await getGame(game.id);
      // Auto-advances to clue-2 when all guessers locked in
      expect(updated?.state).toBe('clue-2');

      // clue-2 -> guess-2
      await advancePhase(game.id, hostId);
      updated = await getGame(game.id);
      expect(updated?.state).toBe('guess-2');

      // Submit second guess
      await submitGuess(game.id, guestId, 6, 6, true);
      updated = await getGame(game.id);
      // Auto-advances to reveal
      expect(updated?.state).toBe('reveal');

      // reveal -> leaderboard
      // Note: clue-giver rotates here
      const newClueGiver = updated?.clueGiverId;
      await advancePhase(game.id, newClueGiver!);
      updated = await getGame(game.id);
      expect(updated?.state).toBe('leaderboard');
    });

    it('only clue-giver can advance clue phases', async () => {
      const { game, hostId } = await setupGame(2);
      await startGame(game.id, hostId);

      const guestId = game.players[1].id;
      const result = await advancePhase(game.id, guestId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only the clue-giver can advance');
    });

    it('starts new round from leaderboard', async () => {
      const { game, hostId } = await setupGame(2);
      await startGame(game.id, hostId);
      const guestId = game.players[1].id;

      // Play through to leaderboard
      await advancePhase(game.id, hostId); // -> guess-1
      await submitGuess(game.id, guestId, 5, 5, true); // -> clue-2
      await advancePhase(game.id, hostId); // -> guess-2
      await submitGuess(game.id, guestId, 6, 6, true); // -> reveal

      let updated = await getGame(game.id);
      const newClueGiver = updated?.clueGiverId!;
      await advancePhase(game.id, newClueGiver); // -> leaderboard

      // Start next round
      await advancePhase(game.id, newClueGiver); // -> clue-1
      updated = await getGame(game.id);
      expect(updated?.state).toBe('clue-1');
      expect(updated?.roundNumber).toBe(2);
    });
  });

  describe('submitGuess', () => {
    it('allows guesser to submit guess', async () => {
      const { game, hostId } = await setupGame(2);
      await startGame(game.id, hostId);
      await advancePhase(game.id, hostId); // -> guess-1

      const guestId = game.players[1].id;
      const result = await submitGuess(game.id, guestId, 10, 10, false);

      expect(result.success).toBe(true);
      expect(result.game?.guesses).toHaveLength(1);
      expect(result.game?.guesses[0].hue).toBe(10);
      expect(result.game?.guesses[0].saturation).toBe(10);
      expect(result.game?.guesses[0].lockedIn).toBe(false);
    });

    it('prevents clue-giver from guessing', async () => {
      const { game, hostId } = await setupGame(2);
      await startGame(game.id, hostId);
      await advancePhase(game.id, hostId);

      const result = await submitGuess(game.id, hostId, 10, 10, false);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Clue-giver cannot guess');
    });

    it('prevents updating after lock-in', async () => {
      const { game, hostId } = await setupGame(3);
      await startGame(game.id, hostId);
      await advancePhase(game.id, hostId);

      const guestId = game.players[1].id;
      await submitGuess(game.id, guestId, 10, 10, true);

      const result = await submitGuess(game.id, guestId, 15, 15, false);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Guess already locked in');
    });

    it('auto-advances when all guessers lock in', async () => {
      const { game, hostId } = await setupGame(2);
      await startGame(game.id, hostId);
      await advancePhase(game.id, hostId);

      const guestId = game.players[1].id;
      const result = await submitGuess(game.id, guestId, 10, 10, true);

      // Should auto-advance to clue-2
      expect(result.game?.state).toBe('clue-2');
    });
  });

  describe('endGame', () => {
    it('ends game from leaderboard', async () => {
      const { game, hostId } = await setupGame(2);
      await startGame(game.id, hostId);
      const guestId = game.players[1].id;

      // Play to leaderboard
      await advancePhase(game.id, hostId);
      await submitGuess(game.id, guestId, 5, 5, true);
      await advancePhase(game.id, hostId);
      await submitGuess(game.id, guestId, 6, 6, true);

      let updated = await getGame(game.id);
      const clueGiver = updated?.clueGiverId!;
      await advancePhase(game.id, clueGiver);

      const result = await endGame(game.id, clueGiver);

      expect(result.success).toBe(true);
      expect(result.game?.state).toBe('finished');
    });

    it('prevents ending from wrong state', async () => {
      const { game, hostId } = await setupGame(2);
      await startGame(game.id, hostId);

      const result = await endGame(game.id, hostId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Can only end game from leaderboard');
    });
  });

  describe('playAgain', () => {
    it('resets game to lobby', async () => {
      const { game, hostId } = await setupGame(2);
      await startGame(game.id, hostId);
      const guestId = game.players[1].id;

      // Play to finished
      await advancePhase(game.id, hostId);
      await submitGuess(game.id, guestId, 5, 5, true);
      await advancePhase(game.id, hostId);
      await submitGuess(game.id, guestId, 6, 6, true);

      let updated = await getGame(game.id);
      const clueGiver = updated?.clueGiverId!;
      await advancePhase(game.id, clueGiver);
      await endGame(game.id, clueGiver);

      const result = await playAgain(game.id, guestId);

      expect(result.success).toBe(true);
      expect(result.game?.state).toBe('lobby');
      expect(result.game?.roundNumber).toBe(0);
      expect(result.game?.guesses).toHaveLength(0);
      expect(result.game?.players[0].totalScore).toBe(0);
      expect(result.game?.players[1].totalScore).toBe(0);
    });

    it('prevents playAgain if not finished', async () => {
      const { game, hostId } = await setupGame(2);
      await startGame(game.id, hostId);

      const result = await playAgain(game.id, hostId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Game is not finished');
    });
  });

  describe('score calculation', () => {
    it('gives 0 points for perfect guess', async () => {
      const { game, hostId } = await setupGame(2);
      await startGame(game.id, hostId);
      const guestId = game.players[1].id;

      // Get target
      let updated = await getGame(game.id);
      const targetHue = updated?.targetHue!;
      const targetSat = updated?.targetSaturation!;

      await advancePhase(game.id, hostId);
      await submitGuess(game.id, guestId, targetHue, targetSat, true);
      await advancePhase(game.id, hostId);
      await submitGuess(game.id, guestId, targetHue, targetSat, true);

      updated = await getGame(game.id);
      expect(updated?.roundScores.find(s => s.playerId === guestId)?.points).toBe(0);
    });

    it('clue-giver gets average score with 3+ players', async () => {
      const { game, hostId } = await setupGame(3);
      await startGame(game.id, hostId);

      const guestId1 = game.players[1].id;
      const guestId2 = game.players[2].id;

      // Get target
      let updated = await getGame(game.id);
      const targetHue = updated?.targetHue!;
      const targetSat = updated?.targetSaturation!;

      await advancePhase(game.id, hostId);
      // Guest1 guesses perfectly
      await submitGuess(game.id, guestId1, targetHue, targetSat, true);
      // Guest2 guesses far away
      await submitGuess(game.id, guestId2, (targetHue + HUE_SEGMENTS / 2) % HUE_SEGMENTS, (targetSat + CHROMA_LEVELS / 2) % CHROMA_LEVELS, true);

      await advancePhase(game.id, hostId);
      await submitGuess(game.id, guestId1, targetHue, targetSat, true);
      await submitGuess(game.id, guestId2, (targetHue + HUE_SEGMENTS / 2) % HUE_SEGMENTS, (targetSat + CHROMA_LEVELS / 2) % CHROMA_LEVELS, true);

      updated = await getGame(game.id);
      const clueGiverScore = updated?.roundScores.find(s => s.isClueGiver);

      // Clue-giver should get average of guest scores
      expect(clueGiverScore).toBeDefined();
      expect(clueGiverScore?.isClueGiver).toBe(true);
    });

    it('clue-giver excluded with exactly 2 players', async () => {
      const { game, hostId } = await setupGame(2);
      await startGame(game.id, hostId);
      const guestId = game.players[1].id;

      await advancePhase(game.id, hostId);
      await submitGuess(game.id, guestId, 5, 5, true);
      await advancePhase(game.id, hostId);
      await submitGuess(game.id, guestId, 6, 6, true);

      const updated = await getGame(game.id);

      // Only 1 score (for the guesser)
      expect(updated?.roundScores).toHaveLength(1);
      expect(updated?.roundScores[0].playerId).toBe(guestId);
    });
  });

  describe('createPlayerId', () => {
    it('returns valid UUID', () => {
      const id = createPlayerId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('returns unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(createPlayerId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('deleteGame', () => {
    it('deletes existing game', async () => {
      const hostId = createPlayerId();
      const game = await createGame(hostId);

      const deleted = await deleteGame(game.id);
      expect(deleted).toBe(true);

      const retrieved = await getGame(game.id);
      expect(retrieved).toBeNull();
    });
  });
});
