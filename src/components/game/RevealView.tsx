'use client';

import ColorWheel from '@/components/ColorWheel';
import ScoreList from '@/components/ScoreList';
import { indexToColor } from '@/lib/colors';
import { ColorComplexity, getGridDimensions, Guess, Player, RoundScore } from '@/lib/types';

interface RevealViewProps {
  roundNumber: number;
  targetHue: number | null;
  targetSaturation: number | null;
  complexity: ColorComplexity;
  guesses: Guess[];
  players: Player[];
  roundScores: RoundScore[];
  currentPlayerId: string | null;
  playerColorMap: Map<string, number>;
  playerNameMap: Map<string, string>;
}

export default function RevealView({
  roundNumber,
  targetHue,
  targetSaturation,
  complexity,
  guesses,
  players,
  roundScores,
  currentPlayerId,
  playerColorMap,
  playerNameMap,
}: RevealViewProps) {
  const gridDims = getGridDimensions(complexity);

  const scoreEntries = roundScores.map((score) => {
    const player = players.find((p) => p.id === score.playerId);
    return {
      id: score.playerId,
      name: player?.name ?? 'Unknown',
      colorIndex: player?.colorIndex ?? 0,
      score: score.points,
      isYou: score.playerId === currentPlayerId,
    };
  });

  return (
    <div className="flex-1 flex flex-col p-4 gap-4">
      <div className="text-center">
        <p className="text-sm text-foreground/60">Round {roundNumber}</p>
        <h2 className="text-xl font-bold">Results</h2>
      </div>

      {targetHue !== null && targetSaturation !== null && (
        <div className="flex justify-center">
          <div
            className="w-20 h-20 rounded-2xl shadow-lg"
            style={{
              backgroundColor: indexToColor(targetHue, targetSaturation, gridDims.hue, gridDims.chroma),
            }}
          />
        </div>
      )}

      <div className="flex justify-center">
        <ColorWheel
          size={320}
          targetHue={targetHue}
          targetSaturation={targetSaturation}
          showTarget={true}
          guesses={guesses}
          playerColorMap={playerColorMap}
          playerNameMap={playerNameMap}
          highlightBestGuess={true}
          disabled={true}
          complexity={complexity}
        />
      </div>

      <ScoreList entries={scoreEntries} title="Round Scores" />

      <p className="text-center text-foreground/60">Waiting for next round...</p>
    </div>
  );
}
