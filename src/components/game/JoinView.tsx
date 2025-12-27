'use client';

import { useState } from 'react';

interface JoinViewProps {
  gameId: string;
  playerCount: number;
  onJoin: (name: string) => Promise<{ success: boolean; error?: string }>;
}

export default function JoinView({ gameId, playerCount, onJoin }: JoinViewProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    setIsJoining(true);
    setError(null);
    const result = await onJoin(name.trim());
    if (!result.success) {
      setError(result.error || 'Failed to join');
    }
    setIsJoining(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Join Game</h1>
        <p className="text-foreground/60">
          Game Code: <span className="font-mono text-primary">{gameId}</span>
        </p>
      </div>

      <div className="card w-full max-w-sm">
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 16))}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          className="input mb-4"
          maxLength={16}
          autoFocus
        />
        <button
          onClick={handleJoin}
          disabled={isJoining || !name.trim()}
          className="btn btn-primary w-full"
        >
          {isJoining ? 'Joining...' : 'Join Game'}
        </button>
        {error && <p className="text-error text-sm mt-2 text-center">{error}</p>}
      </div>

      <p className="text-foreground/40 text-sm">{playerCount} player(s) waiting</p>
    </div>
  );
}
