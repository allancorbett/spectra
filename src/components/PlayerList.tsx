'use client';

import { clsx } from 'clsx';
import PlayerAvatar from './PlayerAvatar';
import { Player } from '@/lib/types';

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string | null;
  hostId: string;
}

export default function PlayerList({ players, currentPlayerId, hostId }: PlayerListProps) {
  return (
    <div className="card flex-1">
      <h2 className="font-semibold mb-3">Players</h2>
      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.id}
            className={clsx(
              'flex items-center gap-3 p-3 rounded-lg',
              player.id === currentPlayerId ? 'bg-primary/20' : 'bg-secondary'
            )}
          >
            <PlayerAvatar name={player.name} colorIndex={player.colorIndex} />
            <span className="flex-1 font-medium">{player.name}</span>
            {player.id === hostId && (
              <span className="text-xs bg-primary/30 text-primary px-2 py-1 rounded">Host</span>
            )}
            {player.id === currentPlayerId && (
              <span className="text-xs text-foreground/40">You</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
