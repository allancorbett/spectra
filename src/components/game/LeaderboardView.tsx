'use client';

import { clsx } from 'clsx';
import PlayerAvatar from '@/components/PlayerAvatar';
import { Player } from '@/lib/types';

interface LeaderboardViewProps {
  roundNumber: number;
  players: Player[];
  currentPlayerId: string | null;
  nextClueGiverName: string;
}

export default function LeaderboardView({
  roundNumber,
  players,
  currentPlayerId,
  nextClueGiverName,
}: LeaderboardViewProps) {
  const sortedPlayers = [...players].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="flex-1 flex flex-col p-4 gap-4">
      <div className="text-center">
        <h2 className="text-xl font-bold">Leaderboard</h2>
        <p className="text-foreground/60">After Round {roundNumber}</p>
      </div>

      <div className="card flex-1">
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
                <span className="w-8 text-center font-bold text-xl">{i + 1}</span>
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

      <p className="text-center text-foreground/60">
        {nextClueGiverName} is giving clues next...
      </p>
    </div>
  );
}
