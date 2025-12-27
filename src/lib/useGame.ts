'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Game, GameSettings } from './types';

const POLL_INTERVAL = 1000; // Poll every second
const PLAYER_ID_KEY = 'spectra_player_id';

export function getPlayerId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PLAYER_ID_KEY);
}

export function setPlayerId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PLAYER_ID_KEY, id);
}

interface UseGameResult {
  game: Game | null;
  playerId: string | null;
  isLoading: boolean;
  error: string | null;
  isHost: boolean;
  isClueGiver: boolean;
  currentPlayer: Game['players'][0] | null;
  createGame: () => Promise<Game | null>;
  joinGame: (gameId: string, name: string) => Promise<{ success: boolean; error?: string }>;
  leaveGame: () => Promise<void>;
  startGame: () => Promise<{ success: boolean; error?: string }>;
  advancePhase: () => Promise<{ success: boolean; error?: string }>;
  submitGuess: (hue: number, saturation: number, lockIn: boolean) => Promise<{ success: boolean; error?: string }>;
  submitClue: (clue: string) => Promise<{ success: boolean; error?: string }>;
  updateSettings: (settings: Partial<GameSettings>) => Promise<{ success: boolean; error?: string }>;
  endGame: () => Promise<{ success: boolean; error?: string }>;
  playAgain: () => Promise<{ success: boolean; error?: string }>;
  loadGame: (gameId: string) => Promise<void>;
}

export function useGame(initialGameId?: string): UseGameResult {
  const [game, setGame] = useState<Game | null>(null);
  const [playerId, setPlayerIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize player ID
  useEffect(() => {
    const id = getPlayerId();
    setPlayerIdState(id);
    setIsLoading(false);
  }, []);

  // API call helper
  const apiCall = useCallback(
    async (action: string, payload: Record<string, unknown> = {}): Promise<{
      success: boolean;
      error?: string;
      game?: Game;
      playerId?: string;
    }> => {
      try {
        const response = await fetch('/api/game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            gameId: game?.id,
            playerId,
            ...payload,
          }),
        });
        const data = await response.json();
        if (data.game) {
          setGame(data.game);
        }
        if (data.playerId) {
          setPlayerId(data.playerId);
          setPlayerIdState(data.playerId);
        }
        if (!data.success && data.error) {
          setError(data.error);
        }
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Network error';
        setError(message);
        return { success: false, error: message };
      }
    },
    [game?.id, playerId]
  );

  // Poll for game updates
  useEffect(() => {
    if (!game?.id || !playerId) return;

    // Don't poll in lobby if not yet started, or if finished
    const shouldPoll = game.state !== 'finished';

    if (!shouldPoll) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    const poll = async () => {
      try {
        const response = await fetch('/api/game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'poll',
            gameId: game.id,
            playerId,
          }),
        });
        const data = await response.json();
        if (data.success && data.game) {
          setGame(data.game);
        }
      } catch {
        // Ignore polling errors
      }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [game?.id, game?.state, playerId]);

  // Load game by ID
  const loadGame = useCallback(async (gameId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/game?gameId=${gameId}`);
      const data = await response.json();
      if (data.success && data.game) {
        setGame(data.game);
      } else {
        setError(data.error || 'Failed to load game');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load initial game if provided
  useEffect(() => {
    if (initialGameId && !game) {
      loadGame(initialGameId);
    }
  }, [initialGameId, game, loadGame]);

  const createGameFn = useCallback(async (): Promise<Game | null> => {
    setIsLoading(true);
    setError(null);
    const result = await apiCall('create', { playerId: getPlayerId() });
    setIsLoading(false);
    return result.game || null;
  }, [apiCall]);

  const joinGameFn = useCallback(
    async (gameId: string, name: string) => {
      setError(null);
      const pid = getPlayerId() || crypto.randomUUID();
      setPlayerId(pid);
      setPlayerIdState(pid);

      const response = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          gameId,
          playerId: pid,
          name,
        }),
      });
      const data = await response.json();
      if (data.game) {
        setGame(data.game);
      }
      if (!data.success && data.error) {
        setError(data.error);
      }
      return data;
    },
    []
  );

  const leaveGameFn = useCallback(async () => {
    await apiCall('leave');
    setGame(null);
  }, [apiCall]);

  const startGameFn = useCallback(async () => {
    return apiCall('start');
  }, [apiCall]);

  const advancePhaseFn = useCallback(async () => {
    return apiCall('advance');
  }, [apiCall]);

  const submitGuessFn = useCallback(
    async (hue: number, saturation: number, lockIn: boolean) => {
      return apiCall('guess', { hue, saturation, lockIn });
    },
    [apiCall]
  );

  const submitClueFn = useCallback(
    async (clue: string) => {
      return apiCall('submitClue', { clue });
    },
    [apiCall]
  );

  const updateSettingsFn = useCallback(
    async (settings: Partial<GameSettings>) => {
      return apiCall('updateSettings', { settings });
    },
    [apiCall]
  );

  const endGameFn = useCallback(async () => {
    return apiCall('end');
  }, [apiCall]);

  const playAgainFn = useCallback(async () => {
    return apiCall('playAgain');
  }, [apiCall]);

  // Computed values
  const isHost = game?.hostId === playerId;
  const isClueGiver = game?.clueGiverId === playerId;
  const currentPlayer = game?.players.find((p) => p.id === playerId) || null;

  return {
    game,
    playerId,
    isLoading,
    error,
    isHost,
    isClueGiver,
    currentPlayer,
    createGame: createGameFn,
    joinGame: joinGameFn,
    leaveGame: leaveGameFn,
    startGame: startGameFn,
    advancePhase: advancePhaseFn,
    submitGuess: submitGuessFn,
    submitClue: submitClueFn,
    updateSettings: updateSettingsFn,
    endGame: endGameFn,
    playAgain: playAgainFn,
    loadGame,
  };
}
