'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ColorWheel from '@/components/ColorWheel';
import { useGame, setPlayerId } from '@/lib/useGame';

export default function Home() {
  const router = useRouter();
  const { createGame, isLoading } = useGame();
  const [gameCode, setGameCode] = useState('');
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateGame = async () => {
    setIsCreating(true);
    setError(null);

    // Generate a new player ID
    const newPlayerId = crypto.randomUUID();
    setPlayerId(newPlayerId);

    const game = await createGame();
    if (game) {
      router.push(`/${game.id}`);
    } else {
      setError('Failed to create game. Please try again.');
    }
    setIsCreating(false);
  };

  const handleJoinGame = () => {
    const code = gameCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError('Please enter a valid 6-character game code');
      return;
    }
    setError(null);
    router.push(`/${code}`);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
      {/* Logo and Title */}
      <div className="text-center">
        <div className="mb-6 animate-float">
          <ColorWheel size={150} />
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-2">
          Spectra
        </h1>
        <p className="text-foreground/60 text-lg">The Color Guessing Party Game</p>
      </div>

      {/* Main Actions */}
      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={handleCreateGame}
          disabled={isLoading || isCreating}
          className="btn btn-primary w-full text-lg py-4"
        >
          {isCreating ? 'Creating...' : 'Create Game'}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-background text-foreground/40">or join a game</span>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Game Code"
            value={gameCode}
            onChange={(e) => {
              setGameCode(e.target.value.toUpperCase().slice(0, 6));
              setError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
            className="input flex-1 text-center text-xl tracking-widest font-mono uppercase"
            maxLength={6}
          />
          <button
            onClick={handleJoinGame}
            disabled={gameCode.length !== 6}
            className="btn btn-secondary"
          >
            Join
          </button>
        </div>

        {error && (
          <p className="text-error text-center text-sm">{error}</p>
        )}
      </div>

      {/* How to Play */}
      <div className="w-full max-w-md">
        <button
          onClick={() => setShowHowToPlay(!showHowToPlay)}
          className="w-full flex items-center justify-between p-4 card hover:bg-secondary/70 transition-colors"
        >
          <span className="font-semibold">How to Play</span>
          <svg
            className={`w-5 h-5 transition-transform ${showHowToPlay ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showHowToPlay && (
          <div className="card mt-2 space-y-4 text-foreground/80">
            <div>
              <h3 className="font-semibold text-foreground mb-1">The Goal</h3>
              <p className="text-sm">
                One player describes a secret color using words (no color names!), and everyone else
                tries to find it on the color wheel. Closest guess wins!
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">How It Works</h3>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>The clue-giver sees a target color and says ONE word to describe it</li>
                <li>Everyone places their first guess on the wheel</li>
                <li>The clue-giver gives a second clue (TWO words this time)</li>
                <li>Everyone places their second guess</li>
                <li>Scores are revealed - lower is better!</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">Scoring</h3>
              <p className="text-sm mb-2">
                <strong>Guessers:</strong> Points are based on distance from the target (0-100).
                Your better guess of the two counts. Lower is better!
              </p>
              <p className="text-sm">
                <strong>Clue-giver:</strong> Gets the average score of all guessers. Give good clues
                to help everyone score low!
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">Taking Turns</h3>
              <p className="text-sm">
                Everyone takes a turn as clue-giver! The role rotates through all players in the
                order they joined. After all rounds, the player with the lowest total score wins!
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">The Catch</h3>
              <p className="text-sm">
                You can&apos;t say color names! Be creative: &quot;tomato&quot;, &quot;ocean&quot;, &quot;jealousy&quot;,
                &quot;sunset&quot;... anything but &quot;red&quot;, &quot;blue&quot;, etc.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-foreground/40 text-sm">2-24 players</p>
    </div>
  );
}
