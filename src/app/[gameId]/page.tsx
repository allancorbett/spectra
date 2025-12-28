'use client';

import { use, useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGame, getPlayerId, setPlayerId } from '@/lib/useGame';
import { PHASE_DURATION } from '@/lib/types';
import {
  JoinView,
  LobbyView,
  ClueGiverView,
  WaitingForClueView,
  GuessingView,
  RevealView,
  LeaderboardView,
  FinishedView,
} from '@/components/game';

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
    joinGame,
    leaveGame,
    startGame,
    advancePhase,
    submitGuess,
    submitClue,
    updateSettings,
    endGame,
    playAgain,
  } = useGame(gameId);

  const [selectedHue, setSelectedHue] = useState<number | null>(null);
  const [selectedSat, setSelectedSat] = useState<number | null>(null);
  const [hasLockedIn, setHasLockedIn] = useState(false);

  // Initialize player ID
  useEffect(() => {
    if (!getPlayerId()) {
      setPlayerId(crypto.randomUUID());
    }
  }, []);

  // Track game state for phase changes
  const prevGameStateRef = useRef<string | null>(null);

  // Compute selection state based on game state
  const computedSelection = useMemo(() => {
    if (!game || !playerId) return { hue: null, sat: null, locked: false };

    const guessNumber = game.state === 'guess-1' ? 1 : game.state === 'guess-2' ? 2 : null;
    if (!guessNumber) return { hue: null, sat: null, locked: false };

    const existingGuess = game.guesses.find(
      (g) => g.playerId === playerId && g.roundNumber === game.roundNumber && g.guessNumber === guessNumber
    );

    if (existingGuess?.lockedIn) {
      return { hue: existingGuess.hue, sat: existingGuess.saturation, locked: true };
    }

    return { hue: null, sat: null, locked: false };
  }, [game, playerId]);

  // Sync computed selection to local state when phase changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const currentState = game?.state ?? null;
    if (prevGameStateRef.current !== currentState) {
      prevGameStateRef.current = currentState;
      // Reset on phase change, but restore if already locked
      if (computedSelection.locked) {
        setSelectedHue(computedSelection.hue);
        setSelectedSat(computedSelection.sat);
        setHasLockedIn(true);
      } else if (currentState === 'guess-1' || currentState === 'guess-2') {
        setSelectedHue(null);
        setSelectedSat(null);
        setHasLockedIn(false);
      }
    }
  }); // Intentionally no deps - runs on every render to check for changes

  // Timer calculation with live updates
  const [now, setNow] = useState(() => Date.now());
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

  // Handle cell click
  const handleCellClick = async (hue: number, saturation: number) => {
    if (hasLockedIn || isClueGiver) return;
    setSelectedHue(hue);
    setSelectedSat(saturation);
    await submitGuess(hue, saturation, false);
  };

  // Handle lock in
  const handleLockIn = async () => {
    if (selectedHue === null || selectedSat === null) return;
    await submitGuess(selectedHue, selectedSat, true);
    setHasLockedIn(true);
  };

  // Handle leave
  const handleLeave = () => {
    leaveGame();
    router.push('/');
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
      <JoinView
        gameId={gameId}
        playerCount={game.players.length}
        onJoin={(name) => joinGame(gameId, name)}
      />
    );
  }

  // Lobby view
  if (game.state === 'lobby') {
    return (
      <LobbyView
        gameId={gameId}
        players={game.players}
        settings={game.settings}
        currentPlayerId={playerId}
        hostId={game.hostId}
        isHost={isHost}
        onStart={startGame}
        onLeave={handleLeave}
        onUpdateSettings={updateSettings}
      />
    );
  }

  // Calculate common values for game views
  const guessNumber = game.state === 'guess-1' ? 1 : game.state === 'guess-2' ? 2 : null;
  const lockedInCount = guessNumber
    ? currentGuesses.filter((g) => g.guessNumber === guessNumber && g.lockedIn).length
    : 0;
  const guesserCount = game.players.filter((p) => p.id !== game.clueGiverId).length;
  const timerEnabled = game.settings.timerEnabled;
  const timerPercent = timerEnabled && timeLeft !== null ? (timeLeft / (PHASE_DURATION / 1000)) * 100 : 100;
  const clueGiver = game.players.find((p) => p.id === game.clueGiverId);

  // Clue-giver view
  if (isClueGiver) {
    return (
      <ClueGiverView
        state={game.state}
        roundNumber={game.roundNumber}
        targetHue={game.targetHue}
        targetSaturation={game.targetSaturation}
        complexity={game.settings.complexity}
        mode={game.settings.mode}
        currentClue={game.currentClue}
        guesses={currentGuesses}
        players={game.players}
        roundScores={game.roundScores}
        clueGiverId={game.clueGiverId!}
        playerColorMap={playerColorMap}
        playerNameMap={playerNameMap}
        lockedInCount={lockedInCount}
        guesserCount={guesserCount}
        timerEnabled={timerEnabled}
        timerPercent={timerPercent}
        timeLeft={timeLeft}
        onAdvancePhase={advancePhase}
        onSubmitClue={submitClue}
        onEndGame={endGame}
      />
    );
  }

  // Guesser waiting for clue
  if (game.state === 'clue-1' || game.state === 'clue-2') {
    return (
      <WaitingForClueView
        roundNumber={game.roundNumber}
        cluePhase={game.state === 'clue-1' ? 1 : 2}
        mode={game.settings.mode}
        clueGiverName={clueGiver?.name ?? 'Unknown'}
        currentClue={game.currentClue}
        timerEnabled={timerEnabled}
        timeLeft={timeLeft}
      />
    );
  }

  // Guesser guessing
  if (game.state === 'guess-1' || game.state === 'guess-2') {
    const firstGuess = game.state === 'guess-2'
      ? currentGuesses.find((g) => g.playerId === playerId && g.guessNumber === 1)
      : null;
    const displayGuesses = firstGuess ? [firstGuess] : [];

    return (
      <GuessingView
        roundNumber={game.roundNumber}
        guessNumber={game.state === 'guess-1' ? 1 : 2}
        complexity={game.settings.complexity}
        selectedHue={selectedHue}
        selectedSaturation={selectedSat}
        hasLockedIn={hasLockedIn}
        displayGuesses={displayGuesses}
        playerColorMap={playerColorMap}
        playerNameMap={playerNameMap}
        lockedInCount={lockedInCount}
        guesserCount={guesserCount}
        timerEnabled={timerEnabled}
        timerPercent={timerPercent}
        timeLeft={timeLeft}
        onCellClick={handleCellClick}
        onLockIn={handleLockIn}
      />
    );
  }

  // Reveal view
  if (game.state === 'reveal') {
    return (
      <RevealView
        roundNumber={game.roundNumber}
        targetHue={game.targetHue}
        targetSaturation={game.targetSaturation}
        complexity={game.settings.complexity}
        guesses={currentGuesses}
        players={game.players}
        roundScores={game.roundScores}
        currentPlayerId={playerId}
        playerColorMap={playerColorMap}
        playerNameMap={playerNameMap}
      />
    );
  }

  // Leaderboard view
  if (game.state === 'leaderboard') {
    return (
      <LeaderboardView
        roundNumber={game.roundNumber}
        players={game.players}
        currentPlayerId={playerId}
        nextClueGiverName={clueGiver?.name ?? 'Unknown'}
      />
    );
  }

  // Finished view
  if (game.state === 'finished') {
    return (
      <FinishedView
        players={game.players}
        currentPlayerId={playerId}
        onPlayAgain={playAgain}
        onNewGame={() => router.push('/')}
      />
    );
  }

  // Fallback
  return (
    <div className="flex-1 flex items-center justify-center">
      <p>Loading game...</p>
    </div>
  );
}
