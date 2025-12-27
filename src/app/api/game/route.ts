import { NextRequest, NextResponse } from 'next/server';
import {
  createGame,
  getGame,
  joinGame,
  startGame,
  advancePhase,
  submitGuess,
  endGame,
  playAgain,
  leaveGame,
  checkAndAdvancePhase,
  createPlayerId,
} from '@/lib/gameStore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, gameId, playerId, ...payload } = body;

    switch (action) {
      case 'create': {
        const newPlayerId = playerId || createPlayerId();
        const game = createGame(newPlayerId);
        return NextResponse.json({ success: true, game, playerId: newPlayerId });
      }

      case 'join': {
        const { name } = payload;
        const result = joinGame(gameId, playerId, name);
        return NextResponse.json(result);
      }

      case 'leave': {
        const game = leaveGame(gameId, playerId);
        return NextResponse.json({ success: true, game });
      }

      case 'start': {
        const result = startGame(gameId, playerId);
        return NextResponse.json(result);
      }

      case 'advance': {
        const result = advancePhase(gameId, playerId);
        return NextResponse.json(result);
      }

      case 'guess': {
        const { hue, saturation, lockIn } = payload;
        const result = submitGuess(gameId, playerId, hue, saturation, lockIn);
        return NextResponse.json(result);
      }

      case 'end': {
        const result = endGame(gameId, playerId);
        return NextResponse.json(result);
      }

      case 'playAgain': {
        const result = playAgain(gameId, playerId);
        return NextResponse.json(result);
      }

      case 'poll': {
        // Check for phase auto-advance
        checkAndAdvancePhase(gameId);
        const game = getGame(gameId);
        if (!game) {
          return NextResponse.json({ success: false, error: 'Game not found' });
        }
        return NextResponse.json({ success: true, game });
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
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

  if (!gameId) {
    return NextResponse.json({ success: false, error: 'Game ID required' }, { status: 400 });
  }

  // Check for phase auto-advance
  checkAndAdvancePhase(gameId);
  const game = getGame(gameId);

  if (!game) {
    return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, game });
}
