'use client';

import { clsx } from 'clsx';
import PlayerAvatar from './PlayerAvatar';

interface ScoreEntry {
  id: string;
  name: string;
  colorIndex: number;
  score: number;
  isYou?: boolean;
  badge?: string;
}

interface ScoreListProps {
  entries: ScoreEntry[];
  title?: string;
  showTrophy?: boolean;
}

export default function ScoreList({ entries, title, showTrophy = false }: ScoreListProps) {
  return (
    <div className="card">
      {title && <h3 className="font-semibold mb-2">{title}</h3>}
      <div className="space-y-2">
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            className={clsx(
              'flex items-center gap-3 p-2 rounded-lg',
              i === 0 ? 'bg-success/20' : entry.isYou ? 'bg-primary/20' : 'bg-secondary'
            )}
          >
            <span className="w-6 text-center font-bold">
              {showTrophy && i === 0 ? '🏆' : i + 1}
            </span>
            <PlayerAvatar name={entry.name} colorIndex={entry.colorIndex} size="sm" />
            <span className="flex-1">
              {entry.name}
              {entry.isYou && ' (You)'}
            </span>
            <span className="font-mono">{entry.score} pts</span>
            {entry.badge && (
              <span className="text-xs bg-primary/30 text-primary px-2 py-1 rounded">
                {entry.badge}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
