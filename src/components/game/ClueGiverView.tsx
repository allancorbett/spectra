'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import ColorWheel from '@/components/ColorWheel';
import TimerBar from '@/components/TimerBar';
import PlayerAvatar from '@/components/PlayerAvatar';
import { indexToColor } from '@/lib/colors';
import { ColorComplexity, GameMode, GameState, getGridDimensions, Guess, Player, RoundScore } from '@/lib/types';

interface ClueGiverViewProps {
  state: GameState;
  roundNumber: number;
  targetHue: number | null;
  targetSaturation: number | null;
  complexity: ColorComplexity;
  mode: GameMode;
  currentClue: string | null;
  guesses: Guess[];
  players: Player[];
  roundScores: RoundScore[];
  clueGiverId: string;
  playerColorMap: Map<string, number>;
  playerNameMap: Map<string, string>;
  lockedInCount: number;
  guesserCount: number;
  timerEnabled: boolean;
  timerPercent: number;
  timeLeft: number | null;
  onAdvancePhase: () => void;
  onSubmitClue: (clue: string) => Promise<{ success: boolean; error?: string }>;
  onEndGame: () => void;
}

export default function ClueGiverView({
  state,
  roundNumber,
  targetHue,
  targetSaturation,
  complexity,
  mode,
  currentClue,
  guesses,
  players,
  roundScores,
  clueGiverId,
  playerColorMap,
  playerNameMap,
  lockedInCount,
  guesserCount,
  timerEnabled,
  timerPercent,
  timeLeft,
  onAdvancePhase,
  onSubmitClue,
  onEndGame,
}: ClueGiverViewProps) {
  const [clueInput, setClueInput] = useState('');
  const [clueError, setClueError] = useState<string | null>(null);
  const gridDims = getGridDimensions(complexity);

  const handleSubmitClue = async () => {
    if (!clueInput.trim()) return;
    setClueError(null);
    const result = await onSubmitClue(clueInput.trim());
    if (!result.success && result.error) {
      setClueError(result.error);
    } else {
      setClueInput('');
    }
  };

  const getTitle = () => {
    switch (state) {
      case 'clue-1':
        return 'Give ONE Word Clue';
      case 'clue-2':
        return 'Give TWO Word Clue';
      case 'guess-1':
      case 'guess-2':
        return 'Players Guessing...';
      case 'reveal':
        return 'Round Results';
      case 'leaderboard':
        return 'Leaderboard';
      default:
        return '';
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 gap-4">
      <div className="text-center">
        <p className="text-sm text-foreground/60">Round {roundNumber}</p>
        <h2 className="text-xl font-bold">{getTitle()}</h2>
      </div>

      {timerEnabled && timeLeft !== null && <TimerBar percent={timerPercent} />}

      {/* Target color swatch */}
      {targetHue !== null && targetSaturation !== null && state !== 'leaderboard' && (
        <div className="flex justify-center">
          <div
            className="w-32 h-32 rounded-2xl shadow-lg animate-pulse-glow"
            style={{
              backgroundColor: indexToColor(targetHue, targetSaturation, gridDims.hue, gridDims.chroma),
            }}
          />
        </div>
      )}

      {/* Clue input for remote mode */}
      {mode === 'remote' && (state === 'clue-1' || state === 'clue-2') && (
        <div className="card">
          <label className="text-sm text-foreground/60 block mb-2">
            Type your {state === 'clue-1' ? 'ONE word' : 'TWO word'} clue:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={clueInput}
              onChange={(e) => setClueInput(e.target.value)}
              placeholder={state === 'clue-1' ? 'e.g., forest' : 'e.g., ocean sunset'}
              className="input flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitClue()}
            />
            <button
              onClick={handleSubmitClue}
              disabled={!clueInput.trim()}
              className="btn btn-primary px-4"
            >
              Send
            </button>
          </div>
          {clueError && <p className="text-error text-sm mt-2">{clueError}</p>}
          {currentClue && (
            <p className="text-success text-sm mt-2">Current clue: &quot;{currentClue}&quot;</p>
          )}
        </div>
      )}

      {/* Color wheel - only show during reveal */}
      {state === 'reveal' && (
        <div className="flex justify-center">
          <ColorWheel
            size={320}
            targetHue={targetHue}
            targetSaturation={targetSaturation}
            showTarget={true}
            guesses={guesses}
            playerColorMap={playerColorMap}
            playerNameMap={playerNameMap}
            highlightBestGuess={true}
            disabled={true}
            complexity={complexity}
          />
        </div>
      )}

      {/* Guessing status */}
      {(state === 'guess-1' || state === 'guess-2') && (
        <div className="text-center">
          <p className="text-foreground/60">
            {lockedInCount}/{guesserCount} players locked in
          </p>
          {timerEnabled && timeLeft !== null && (
            <p className="text-2xl font-bold">{timeLeft}s</p>
          )}
        </div>
      )}

      {/* Round scores */}
      {state === 'reveal' && (
        <div className="card">
          <h3 className="font-semibold mb-2">Round Scores</h3>
          <div className="space-y-2">
            {roundScores.map((score, i) => {
              const player = players.find((p) => p.id === score.playerId);
              return (
                <div
                  key={score.playerId}
                  className={clsx(
                    'flex items-center gap-3 p-2 rounded-lg',
                    i === 0 ? 'bg-success/20' : 'bg-secondary'
                  )}
                >
                  <span className="w-6 text-center font-bold">{i + 1}</span>
                  <PlayerAvatar
                    name={player?.name ?? '?'}
                    colorIndex={player?.colorIndex ?? 0}
                    size="sm"
                  />
                  <span className="flex-1">{player?.name}</span>
                  <span className="font-mono">{score.points} pts</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {state === 'leaderboard' && (
        <div className="card flex-1">
          <h3 className="font-semibold mb-2">Total Scores</h3>
          <div className="space-y-2">
            {[...players]
              .sort((a, b) => a.totalScore - b.totalScore)
              .map((player, i) => (
                <div
                  key={player.id}
                  className={clsx(
                    'flex items-center gap-3 p-2 rounded-lg',
                    i === 0 ? 'bg-success/20' : 'bg-secondary'
                  )}
                >
                  <span className="w-6 text-center font-bold">{i + 1}</span>
                  <PlayerAvatar name={player.name} colorIndex={player.colorIndex} size="sm" />
                  <span className="flex-1">{player.name}</span>
                  <span className="font-mono">{player.totalScore} pts</span>
                  {player.id === clueGiverId && (
                    <span className="text-xs bg-primary/30 text-primary px-2 py-1 rounded">
                      Next
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {(state === 'clue-1' || state === 'clue-2') && (
          <button onClick={onAdvancePhase} className="btn btn-primary w-full">
            Clue Given
          </button>
        )}
        {state === 'reveal' && (
          <button onClick={onAdvancePhase} className="btn btn-primary w-full">
            Show Leaderboard
          </button>
        )}
        {state === 'leaderboard' && (
          <>
            <button onClick={onAdvancePhase} className="btn btn-success w-full">
              Start Next Round
            </button>
            <button onClick={onEndGame} className="btn btn-error w-full">
              End Game
            </button>
          </>
        )}
      </div>
    </div>
  );
}
