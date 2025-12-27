'use client';

import { clsx } from 'clsx';
import PlayerAvatar from '@/components/PlayerAvatar';
import { Player } from '@/lib/types';

interface FinishedViewProps {
  players: Player[];
  currentPlayerId: string | null;
  onPlayAgain: () => void;
  onNewGame: () => void;
}

export default function FinishedView({
  players,
  currentPlayerId,
  onPlayAgain,
  onNewGame,
}: FinishedViewProps) {
  const sortedPlayers = [...players].sort((a, b) => a.totalScore - b.totalScore);
  const winner = sortedPlayers[0];

  return (
    <div className="flex-1 flex flex-col p-4 gap-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
        <p className="text-xl text-primary">{winner?.name} wins!</p>
      </div>

      <div className="card flex-1">
        <h3 className="font-semibold mb-3 text-center">Final Standings</h3>
        <div className="space-y-2">
          {sortedPlayers.map((player, i) => {
            const isYou = player.id === currentPlayerId;
            return (
              <div
                key={player.id}
                className={clsx(
                  'flex items-center gap-3 p-3 rounded-lg',
                  i === 0 ? 'bg-success/20' : isYou ? 'bg-primary/20' : 'bg-secondary'
                )}
              >
                <span className="w-8 text-center font-bold text-xl">
                  {i === 0 ? '🏆' : i + 1}
                </span>
                <PlayerAvatar name={player.name} colorIndex={player.colorIndex} />
                <span className="flex-1 font-medium">
                  {player.name}
                  {isYou && ' (You)'}
                </span>
                <span className="font-mono text-lg">{player.totalScore}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <button onClick={onPlayAgain} className="btn btn-success w-full">
          Play Again
        </button>
        <button onClick={onNewGame} className="btn btn-secondary w-full">
          New Game
        </button>
      </div>
    </div>
  );
}
