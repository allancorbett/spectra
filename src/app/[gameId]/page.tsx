'use client';

import { use, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { clsx } from 'clsx';
import ColorWheel from '@/components/ColorWheel';
import ColorGrid from '@/components/ColorGrid';
import { useGame, getPlayerId, setPlayerId } from '@/lib/useGame';
import { hslToColor } from '@/lib/colors';
import { PLAYER_COLORS, PHASE_DURATION, MIN_PLAYERS } from '@/lib/types';

interface GamePageProps {
  params: Promise<{ gameId: string }>;
}

export default function GamePage({ params }: GamePageProps) {
  const { gameId } = use(params);
  const router = useRouter();
  const {
    game,
    playerId,
    isLoading,
    error,
    isHost,
    isClueGiver,
    currentPlayer,
    joinGame,
    leaveGame,
    startGame,
    advancePhase,
    submitGuess,
    endGame,
    playAgain,
    loadGame,
  } = useGame(gameId);

  const [name, setName] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [selectedHue, setSelectedHue] = useState<number | null>(null);
  const [selectedSat, setSelectedSat] = useState<number | null>(null);
  const [hasLockedIn, setHasLockedIn] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize player ID
  useEffect(() => {
    if (!getPlayerId()) {
      setPlayerId(crypto.randomUUID());
    }
  }, []);

  // Reset selection on phase change
  useEffect(() => {
    if (game?.state === 'guess-1' || game?.state === 'guess-2') {
      setSelectedHue(null);
      setSelectedSat(null);
      setHasLockedIn(false);
    }
  }, [game?.state]);

  // Check if already locked in this phase
  useEffect(() => {
    if (game && playerId) {
      const guessNumber = game.state === 'guess-1' ? 1 : game.state === 'guess-2' ? 2 : null;
      if (guessNumber) {
        const existingGuess = game.guesses.find(
          (g) => g.playerId === playerId && g.roundNumber === game.roundNumber && g.guessNumber === guessNumber
        );
        if (existingGuess?.lockedIn) {
          setHasLockedIn(true);
          setSelectedHue(existingGuess.hue);
          setSelectedSat(existingGuess.saturation);
        }
      }
    }
  }, [game, playerId]);

  // Timer calculation with live updates
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!game?.phaseEndTime) return;
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, [game?.phaseEndTime]);

  const timeLeft = useMemo(() => {
    if (!game?.phaseEndTime) return null;
    const remaining = Math.max(0, game.phaseEndTime - now);
    return Math.ceil(remaining / 1000);
  }, [game?.phaseEndTime, now]);

  // Player color and name maps
  const playerColorMap = useMemo(() => {
    const map = new Map<string, number>();
    game?.players.forEach((p) => map.set(p.id, p.colorIndex));
    return map;
  }, [game?.players]);

  const playerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    game?.players.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [game?.players]);

  // Get guesses for current round
  const currentGuesses = useMemo(() => {
    if (!game) return [];
    return game.guesses.filter((g) => g.roundNumber === game.roundNumber);
  }, [game]);

  // Handle joining
  const handleJoin = async () => {
    if (!name.trim()) {
      setJoinError('Please enter your name');
      return;
    }
    setIsJoining(true);
    setJoinError(null);
    const result = await joinGame(gameId, name.trim());
    if (!result.success) {
      setJoinError(result.error || 'Failed to join');
    }
    setIsJoining(false);
  };

  // Handle cell click
  const handleCellClick = async (hue: number, saturation: number) => {
    if (hasLockedIn || isClueGiver) return;
    setSelectedHue(hue);
    setSelectedSat(saturation);
    // Submit guess without locking in
    await submitGuess(hue, saturation, false);
  };

  // Handle lock in
  const handleLockIn = async () => {
    if (selectedHue === null || selectedSat === null) return;
    await submitGuess(selectedHue, selectedSat, true);
    setHasLockedIn(true);
  };

  // Copy game URL
  const copyGameUrl = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/${gameId}` : '';
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Game not found
  if (!game) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <div className="card text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Game Not Found</h2>
          <p className="text-foreground/60 mb-4">
            {error || "This game doesn't exist or has ended. Check your link and try again."}
          </p>
          <button onClick={() => router.push('/')} className="btn btn-primary">
            Create Your Own Game
          </button>
        </div>
      </div>
    );
  }

  // Check if user is a player
  const isPlayer = game.players.some((p) => p.id === playerId);

  // Game in progress but user is not a player
  if (game.state !== 'lobby' && !isPlayer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <div className="card text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Game In Progress</h2>
          <p className="text-foreground/60 mb-4">
            This game has already started - you&apos;ll have to catch the next one!
          </p>
          <button onClick={() => router.push('/')} className="btn btn-primary">
            Create Your Own Game
          </button>
        </div>
      </div>
    );
  }

  // Join page (lobby state, not a player yet)
  if (game.state === 'lobby' && !isPlayer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Join Game</h1>
          <p className="text-foreground/60">Game Code: <span className="font-mono text-primary">{gameId}</span></p>
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
          {joinError && <p className="text-error text-sm mt-2 text-center">{joinError}</p>}
        </div>

        <p className="text-foreground/40 text-sm">{game.players.length} player(s) waiting</p>
      </div>
    );
  }

  // Lobby views
  if (game.state === 'lobby') {
    const gameUrl = typeof window !== 'undefined' ? `${window.location.origin}/${gameId}` : '';

    return (
      <div className="flex-1 flex flex-col p-6 gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-1">Game Lobby</h1>
          <p className="text-foreground/60">{game.players.length}/24 players</p>
        </div>

        {/* Share section (host only shows prominently) */}
        {isHost && (
          <div className="card text-center">
            <p className="text-sm text-foreground/60 mb-2">Share this code to invite players</p>
            <div
              className="bg-secondary rounded-xl p-4 mb-4 cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={copyGameUrl}
            >
              <p className="text-3xl font-mono font-bold tracking-widest text-primary">{gameId}</p>
              <p className="text-xs text-foreground/40 mt-1">{copied ? 'Copied!' : 'Tap to copy link'}</p>
            </div>
            <div className="flex justify-center">
              <QRCodeSVG value={gameUrl} size={150} bgColor="transparent" fgColor="#f0f0f5" />
            </div>
          </div>
        )}

        {/* Player list */}
        <div className="card flex-1">
          <h2 className="font-semibold mb-3">Players</h2>
          <div className="space-y-2">
            {game.players.map((player) => (
              <div
                key={player.id}
                className={clsx(
                  'flex items-center gap-3 p-3 rounded-lg',
                  player.id === playerId ? 'bg-primary/20' : 'bg-secondary'
                )}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: PLAYER_COLORS[player.colorIndex] }}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 font-medium">{player.name}</span>
                {player.id === game.hostId && (
                  <span className="text-xs bg-primary/30 text-primary px-2 py-1 rounded">Host</span>
                )}
                {player.id === playerId && (
                  <span className="text-xs text-foreground/40">You</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {isHost ? (
            <>
              <button
                onClick={() => startGame()}
                disabled={game.players.length < MIN_PLAYERS}
                className="btn btn-success w-full"
              >
                {game.players.length < MIN_PLAYERS
                  ? `Need ${MIN_PLAYERS - game.players.length} more player(s)`
                  : 'Start Game'}
              </button>
              <button onClick={() => { leaveGame(); router.push('/'); }} className="btn btn-secondary w-full">
                Cancel Game
              </button>
            </>
          ) : (
            <>
              <p className="text-center text-foreground/60">Waiting for host to start the game...</p>
              <button onClick={() => { leaveGame(); router.push('/'); }} className="btn btn-secondary w-full">
                Leave Game
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Get locked in count for current phase
  const guessNumber = game.state === 'guess-1' ? 1 : game.state === 'guess-2' ? 2 : null;
  const lockedInCount = guessNumber
    ? currentGuesses.filter((g) => g.guessNumber === guessNumber && g.lockedIn).length
    : 0;
  const guesserCount = game.players.filter((p) => p.id !== game.clueGiverId).length;

  // Timer bar percentage
  const timerPercent = timeLeft !== null ? (timeLeft / (PHASE_DURATION / 1000)) * 100 : 100;

  // Clue-giver view
  if (isClueGiver) {
    return (
      <div className="flex-1 flex flex-col p-4 gap-4">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm text-foreground/60">Round {game.roundNumber}</p>
          <h2 className="text-xl font-bold">
            {game.state === 'clue-1' && 'Give ONE Word Clue'}
            {game.state === 'clue-2' && 'Give TWO Word Clue'}
            {game.state === 'guess-1' && 'Players Guessing...'}
            {game.state === 'guess-2' && 'Players Guessing...'}
            {game.state === 'reveal' && 'Round Results'}
            {game.state === 'leaderboard' && 'Leaderboard'}
          </h2>
        </div>

        {/* Timer */}
        {timeLeft !== null && (
          <div className="timer-bar">
            <div className="timer-bar-fill" style={{ width: `${timerPercent}%` }} />
          </div>
        )}

        {/* Target color swatch */}
        {game.targetHue !== null && game.targetSaturation !== null && game.state !== 'leaderboard' && (
          <div className="flex justify-center">
            <div
              className="w-32 h-32 rounded-2xl shadow-lg animate-pulse-glow"
              style={{ backgroundColor: hslToColor(game.targetHue, game.targetSaturation) }}
            />
          </div>
        )}

        {/* Color wheel - only show during reveal */}
        {game.state === 'reveal' && (
          <div className="flex justify-center">
            <ColorWheel
              size={Math.min(320, typeof window !== 'undefined' ? window.innerWidth - 48 : 320)}
              targetHue={game.targetHue}
              targetSaturation={game.targetSaturation}
              showTarget={true}
              guesses={game.state === 'reveal' ? currentGuesses : currentGuesses.filter((g) => g.lockedIn)}
              playerColorMap={playerColorMap}
              playerNameMap={playerNameMap}
              highlightBestGuess={game.state === 'reveal'}
              disabled={true}
            />
          </div>
        )}

        {/* Status / Scores */}
        {(game.state === 'guess-1' || game.state === 'guess-2') && (
          <div className="text-center">
            <p className="text-foreground/60">{lockedInCount}/{guesserCount} players locked in</p>
            {timeLeft !== null && <p className="text-2xl font-bold">{timeLeft}s</p>}
          </div>
        )}

        {game.state === 'reveal' && (
          <div className="card">
            <h3 className="font-semibold mb-2">Round Scores</h3>
            <div className="space-y-2">
              {game.roundScores.map((score, i) => {
                const player = game.players.find((p) => p.id === score.playerId);
                return (
                  <div
                    key={score.playerId}
                    className={clsx(
                      'flex items-center gap-3 p-2 rounded-lg',
                      i === 0 ? 'bg-success/20' : 'bg-secondary'
                    )}
                  >
                    <span className="w-6 text-center font-bold">{i + 1}</span>
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: PLAYER_COLORS[player?.colorIndex ?? 0] }}
                    >
                      {player?.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1">{player?.name}</span>
                    <span className="font-mono">{score.points} pts</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {game.state === 'leaderboard' && (
          <div className="card flex-1">
            <h3 className="font-semibold mb-2">Total Scores</h3>
            <div className="space-y-2">
              {[...game.players]
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
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: PLAYER_COLORS[player.colorIndex] }}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1">{player.name}</span>
                    <span className="font-mono">{player.totalScore} pts</span>
                    {player.id === game.clueGiverId && (
                      <span className="text-xs bg-primary/30 text-primary px-2 py-1 rounded">Next</span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {(game.state === 'clue-1' || game.state === 'clue-2') && (
            <button onClick={() => advancePhase()} className="btn btn-primary w-full">
              Clue Given
            </button>
          )}
          {game.state === 'reveal' && (
            <button onClick={() => advancePhase()} className="btn btn-primary w-full">
              Show Leaderboard
            </button>
          )}
          {game.state === 'leaderboard' && (
            <>
              <button onClick={() => advancePhase()} className="btn btn-success w-full">
                Start Next Round
              </button>
              <button onClick={() => endGame()} className="btn btn-error w-full">
                End Game
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Guesser view
  if (game.state === 'clue-1' || game.state === 'clue-2') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <div className="text-center">
          <p className="text-sm text-foreground/60">Round {game.roundNumber}</p>
          <h2 className="text-2xl font-bold mb-4">Listen for the clue!</h2>
          <p className="text-foreground/60">
            {game.state === 'clue-1' ? 'ONE word' : 'TWO words'}
          </p>
        </div>
        <div className="animate-pulse">
          <ColorWheel size={200} disabled />
        </div>
        {timeLeft !== null && (
          <p className="text-3xl font-bold">{timeLeft}s</p>
        )}
      </div>
    );
  }

  if (game.state === 'guess-1' || game.state === 'guess-2') {
    // Show first guess marker during guess-2
    const firstGuess = game.state === 'guess-2'
      ? currentGuesses.find((g) => g.playerId === playerId && g.guessNumber === 1)
      : null;
    const displayGuesses = firstGuess ? [firstGuess] : [];

    return (
      <div className="flex-1 flex flex-col p-4 gap-4">
        <div className="text-center">
          <p className="text-sm text-foreground/60">Round {game.roundNumber}</p>
          <h2 className="text-xl font-bold">
            {hasLockedIn ? 'Waiting for others...' : `Place your ${game.state === 'guess-1' ? 'first' : 'second'} guess`}
          </h2>
        </div>

        {/* Timer */}
        {timeLeft !== null && (
          <div className="timer-bar">
            <div className="timer-bar-fill" style={{ width: `${timerPercent}%` }} />
          </div>
        )}

        <ColorGrid
          selectedHue={selectedHue}
          selectedSaturation={selectedSat}
          guesses={displayGuesses}
          playerColorMap={playerColorMap}
          playerNameMap={playerNameMap}
          onCellClick={handleCellClick}
          disabled={hasLockedIn}
        />

        {/* Selected color preview */}
        {selectedHue !== null && selectedSat !== null && !hasLockedIn && (
          <div className="flex justify-center">
            <div
              className="w-16 h-16 rounded-xl shadow-lg"
              style={{ backgroundColor: hslToColor(selectedHue, selectedSat) }}
            />
          </div>
        )}

        <div className="space-y-2">
          {!hasLockedIn && (
            <button
              onClick={handleLockIn}
              disabled={selectedHue === null || selectedSat === null}
              className="btn btn-success w-full"
            >
              Lock In
            </button>
          )}
          {timeLeft !== null && (
            <p className="text-center text-2xl font-bold">{timeLeft}s</p>
          )}
          <p className="text-center text-foreground/60 text-sm">
            {lockedInCount}/{guesserCount} players locked in
          </p>
        </div>
      </div>
    );
  }

  // Reveal view (for guessers)
  if (game.state === 'reveal') {
    return (
      <div className="flex-1 flex flex-col p-4 gap-4">
        <div className="text-center">
          <p className="text-sm text-foreground/60">Round {game.roundNumber}</p>
          <h2 className="text-xl font-bold">Results</h2>
        </div>

        {/* Target swatch */}
        {game.targetHue !== null && game.targetSaturation !== null && (
          <div className="flex justify-center">
            <div
              className="w-20 h-20 rounded-2xl shadow-lg"
              style={{ backgroundColor: hslToColor(game.targetHue, game.targetSaturation) }}
            />
          </div>
        )}

        <div className="flex justify-center">
          <ColorWheel
            size={Math.min(320, typeof window !== 'undefined' ? window.innerWidth - 48 : 320)}
            targetHue={game.targetHue}
            targetSaturation={game.targetSaturation}
            showTarget={true}
            guesses={currentGuesses}
            playerColorMap={playerColorMap}
            playerNameMap={playerNameMap}
            highlightBestGuess={true}
            disabled={true}
          />
        </div>

        <div className="card">
          <h3 className="font-semibold mb-2">Round Scores</h3>
          <div className="space-y-2">
            {game.roundScores.map((score, i) => {
              const player = game.players.find((p) => p.id === score.playerId);
              const isYou = score.playerId === playerId;
              return (
                <div
                  key={score.playerId}
                  className={clsx(
                    'flex items-center gap-3 p-2 rounded-lg',
                    i === 0 ? 'bg-success/20' : isYou ? 'bg-primary/20' : 'bg-secondary'
                  )}
                >
                  <span className="w-6 text-center font-bold">{i + 1}</span>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: PLAYER_COLORS[player?.colorIndex ?? 0] }}
                  >
                    {player?.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1">{player?.name}{isYou && ' (You)'}</span>
                  <span className="font-mono">{score.points} pts</span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-foreground/60">Waiting for next round...</p>
      </div>
    );
  }

  // Leaderboard view (for guessers)
  if (game.state === 'leaderboard') {
    const clueGiver = game.players.find((p) => p.id === game.clueGiverId);
    return (
      <div className="flex-1 flex flex-col p-4 gap-4">
        <div className="text-center">
          <h2 className="text-xl font-bold">Leaderboard</h2>
          <p className="text-foreground/60">After Round {game.roundNumber}</p>
        </div>

        <div className="card flex-1">
          <div className="space-y-2">
            {[...game.players]
              .sort((a, b) => a.totalScore - b.totalScore)
              .map((player, i) => {
                const isYou = player.id === playerId;
                return (
                  <div
                    key={player.id}
                    className={clsx(
                      'flex items-center gap-3 p-3 rounded-lg',
                      i === 0 ? 'bg-success/20' : isYou ? 'bg-primary/20' : 'bg-secondary'
                    )}
                  >
                    <span className="w-8 text-center font-bold text-xl">{i + 1}</span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: PLAYER_COLORS[player.colorIndex] }}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 font-medium">{player.name}{isYou && ' (You)'}</span>
                    <span className="font-mono text-lg">{player.totalScore}</span>
                  </div>
                );
              })}
          </div>
        </div>

        <p className="text-center text-foreground/60">
          {clueGiver?.name} is giving clues next...
        </p>
      </div>
    );
  }

  // Finished view
  if (game.state === 'finished') {
    const sortedPlayers = [...game.players].sort((a, b) => a.totalScore - b.totalScore);
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
              const isYou = player.id === playerId;
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
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: PLAYER_COLORS[player.colorIndex] }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 font-medium">{player.name}{isYou && ' (You)'}</span>
                  <span className="font-mono text-lg">{player.totalScore}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <button onClick={() => playAgain()} className="btn btn-success w-full">
            Play Again
          </button>
          <button onClick={() => router.push('/')} className="btn btn-secondary w-full">
            New Game
          </button>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex-1 flex items-center justify-center">
      <p>Loading game...</p>
    </div>
  );
}
