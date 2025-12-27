import { NextRequest, NextResponse } from 'next/server';
import { GameActionType } from '@/lib/types';
import {
  createGame,
  getGame,
  joinGame,
  startGame,
  advancePhase,
  submitGuess,
  submitClue,
  updateSettings,
  endGame,
  playAgain,
  leaveGame,
  checkAndAdvancePhase,
  createPlayerId,
} from '@/lib/gameStore';

// Valid actions for type checking
const VALID_ACTIONS: GameActionType[] = [
  'create',
  'join',
  'leave',
  'start',
  'advance',
  'guess',
  'submitClue',
  'updateSettings',
  'end',
  'playAgain',
  'poll',
];

function isValidAction(action: unknown): action is GameActionType {
  return typeof action === 'string' && VALID_ACTIONS.includes(action as GameActionType);
}

function isValidGameId(gameId: unknown): gameId is string {
  return typeof gameId === 'string' && gameId.length === 6;
}

function isValidPlayerId(playerId: unknown): playerId is string {
  return typeof playerId === 'string' && playerId.length > 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, gameId, playerId, ...payload } = body;

    // Validate action
    if (!isValidAction(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing action' },
        { status: 400 }
      );
    }

    // Actions that require gameId
    const requiresGameId: GameActionType[] = ['join', 'leave', 'start', 'advance', 'guess', 'submitClue', 'updateSettings', 'end', 'playAgain', 'poll'];
    if (requiresGameId.includes(action) && !isValidGameId(gameId)) {
      return NextResponse.json(
        { success: false, error: 'Valid game ID required' },
        { status: 400 }
      );
    }

    // Actions that require playerId
    const requiresPlayerId: GameActionType[] = ['join', 'leave', 'start', 'advance', 'guess', 'submitClue', 'updateSettings', 'end', 'playAgain'];
    if (requiresPlayerId.includes(action) && !isValidPlayerId(playerId)) {
      return NextResponse.json(
        { success: false, error: 'Valid player ID required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'create': {
        const newPlayerId = isValidPlayerId(playerId) ? playerId : createPlayerId();
        const game = await createGame(newPlayerId);
        return NextResponse.json({ success: true, game, playerId: newPlayerId });
      }

      case 'join': {
        const { name } = payload;
        if (typeof name !== 'string' || !name.trim()) {
          return NextResponse.json(
            { success: false, error: 'Name is required' },
            { status: 400 }
          );
        }
        const result = await joinGame(gameId, playerId, name);
        return NextResponse.json(result);
      }

      case 'leave': {
        const game = await leaveGame(gameId, playerId);
        return NextResponse.json({ success: true, game });
      }

      case 'start': {
        const result = await startGame(gameId, playerId);
        return NextResponse.json(result);
      }

      case 'advance': {
        const result = await advancePhase(gameId, playerId);
        return NextResponse.json(result);
      }

      case 'guess': {
        const { hue, saturation, lockIn } = payload;
        if (typeof hue !== 'number' || typeof saturation !== 'number') {
          return NextResponse.json(
            { success: false, error: 'Invalid guess data' },
            { status: 400 }
          );
        }
        const result = await submitGuess(gameId, playerId, hue, saturation, Boolean(lockIn));
        return NextResponse.json(result);
      }

      case 'submitClue': {
        const { clue } = payload;
        if (typeof clue !== 'string') {
          return NextResponse.json(
            { success: false, error: 'Clue is required' },
            { status: 400 }
          );
        }
        const result = await submitClue(gameId, playerId, clue);
        return NextResponse.json(result);
      }

      case 'updateSettings': {
        const { settings } = payload;
        if (typeof settings !== 'object' || settings === null) {
          return NextResponse.json(
            { success: false, error: 'Settings object required' },
            { status: 400 }
          );
        }
        const result = await updateSettings(gameId, playerId, settings);
        return NextResponse.json(result);
      }

      case 'end': {
        const result = await endGame(gameId, playerId);
        return NextResponse.json(result);
      }

      case 'playAgain': {
        const result = await playAgain(gameId, playerId);
        return NextResponse.json(result);
      }

      case 'poll': {
        await checkAndAdvancePhase(gameId);
        const game = await getGame(gameId);
        if (!game) {
          return NextResponse.json({ success: false, error: 'Game not found' });
        }
        return NextResponse.json({ success: true, game });
      }

      default: {
        // TypeScript exhaustiveness check
        const _exhaustive: never = action;
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
      }
    }
  } catch (error) {
    console.error('Game API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('gameId');

  if (!isValidGameId(gameId)) {
    return NextResponse.json(
      { success: false, error: 'Valid 6-character game ID required' },
      { status: 400 }
    );
  }

  await checkAndAdvancePhase(gameId);
  const game = await getGame(gameId);

  if (!game) {
    return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, game });
}
