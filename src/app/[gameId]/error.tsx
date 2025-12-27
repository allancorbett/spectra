'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GameError({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    console.error('Game error:', error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
      <div className="card text-center max-w-md">
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-foreground/60 mb-4">
          We encountered an error loading this game. Please try again.
        </p>
        <div className="space-y-2">
          <button onClick={reset} className="btn btn-primary w-full">
            Try Again
          </button>
          <button onClick={() => router.push('/')} className="btn btn-secondary w-full">
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
