'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import PlayerList from '@/components/PlayerList';
import GameSettings from './GameSettings';
import { GameSettings as GameSettingsType, MIN_PLAYERS, Player } from '@/lib/types';

interface LobbyViewProps {
  gameId: string;
  players: Player[];
  settings: GameSettingsType;
  currentPlayerId: string | null;
  hostId: string;
  isHost: boolean;
  onStart: () => void;
  onLeave: () => void;
  onUpdateSettings: (settings: Partial<GameSettingsType>) => void;
}

export default function LobbyView({
  gameId,
  players,
  settings,
  currentPlayerId,
  hostId,
  isHost,
  onStart,
  onLeave,
  onUpdateSettings,
}: LobbyViewProps) {
  const [copied, setCopied] = useState(false);
  const gameUrl = typeof window !== 'undefined' ? `${window.location.origin}/${gameId}` : '';

  const copyGameUrl = () => {
    navigator.clipboard.writeText(gameUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col p-6 gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-1">Game Lobby</h1>
        <p className="text-foreground/60">{players.length}/24 players</p>
      </div>

      {isHost && (
        <div className="card text-center">
          <p className="text-sm text-foreground/60 mb-2">Share this code to invite players</p>
          <div
            className="bg-secondary rounded-xl p-4 mb-4 cursor-pointer hover:bg-secondary/80 transition-colors"
            onClick={copyGameUrl}
          >
            <p className="text-3xl font-mono font-bold tracking-widest text-primary">{gameId}</p>
            <p className="text-xs text-foreground/40 mt-1">
              {copied ? 'Copied!' : 'Tap to copy link'}
            </p>
          </div>
          <div className="flex justify-center">
            <QRCodeSVG value={gameUrl} size={150} bgColor="transparent" fgColor="#f0f0f5" />
          </div>
        </div>
      )}

      <GameSettings settings={settings} isHost={isHost} onUpdate={onUpdateSettings} />

      <PlayerList players={players} currentPlayerId={currentPlayerId} hostId={hostId} />

      <div className="space-y-3">
        {isHost ? (
          <>
            <button
              onClick={onStart}
              disabled={players.length < MIN_PLAYERS}
              className="btn btn-success w-full"
            >
              {players.length < MIN_PLAYERS
                ? `Need ${MIN_PLAYERS - players.length} more player(s)`
                : 'Start Game'}
            </button>
            <button onClick={onLeave} className="btn btn-secondary w-full">
              Cancel Game
            </button>
          </>
        ) : (
          <>
            <p className="text-center text-foreground/60">
              Waiting for host to start the game...
            </p>
            <button onClick={onLeave} className="btn btn-secondary w-full">
              Leave Game
            </button>
          </>
        )}
      </div>
    </div>
  );
}
