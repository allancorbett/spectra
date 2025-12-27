import { render, screen } from '@testing-library/react';
import LeaderboardView from '@/components/game/LeaderboardView';
import { Player } from '@/lib/types';

describe('LeaderboardView', () => {
  const mockPlayers: Player[] = [
    { id: 'player-1', name: 'Alice', colorIndex: 0, totalScore: 50 },
    { id: 'player-2', name: 'Bob', colorIndex: 1, totalScore: 30 },
    { id: 'player-3', name: 'Charlie', colorIndex: 2, totalScore: 70 },
  ];

  const defaultProps = {
    roundNumber: 2,
    players: mockPlayers,
    currentPlayerId: 'player-1',
    nextClueGiverName: 'Dan',
  };

  it('displays leaderboard header', () => {
    render(<LeaderboardView {...defaultProps} />);
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
  });

  it('displays round number', () => {
    render(<LeaderboardView {...defaultProps} />);
    expect(screen.getByText('After Round 2')).toBeInTheDocument();
  });

  it('displays all players', () => {
    render(<LeaderboardView {...defaultProps} />);
    // Use partial text match since Alice has " (You)" appended
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
    expect(screen.getByText(/Charlie/)).toBeInTheDocument();
  });

  it('sorts players by score (lowest first)', () => {
    render(<LeaderboardView {...defaultProps} />);

    // Check that Bob (30) is first, Alice (50) is second, Charlie (70) is third
    const rankings = screen.getAllByText(/^[1-3]$/);
    expect(rankings).toHaveLength(3);

    // Check order by looking at score values
    const scores = screen.getAllByText(/^(30|50|70)$/);
    expect(scores[0]).toHaveTextContent('30'); // Bob
    expect(scores[1]).toHaveTextContent('50'); // Alice
    expect(scores[2]).toHaveTextContent('70'); // Charlie
  });

  it('displays player scores', () => {
    render(<LeaderboardView {...defaultProps} />);
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
  });

  it('displays rank numbers', () => {
    render(<LeaderboardView {...defaultProps} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('marks current player with (You)', () => {
    render(<LeaderboardView {...defaultProps} />);
    expect(screen.getByText(/\(You\)/)).toBeInTheDocument();
  });

  it('displays next clue giver message', () => {
    render(<LeaderboardView {...defaultProps} />);
    expect(screen.getByText(/Dan.*is giving clues next/)).toBeInTheDocument();
  });

  it('handles no current player', () => {
    render(<LeaderboardView {...defaultProps} currentPlayerId={null} />);
    expect(screen.queryByText(/\(You\)/)).not.toBeInTheDocument();
  });

  it('handles single player', () => {
    const singlePlayer: Player[] = [
      { id: 'player-1', name: 'Solo', colorIndex: 0, totalScore: 100 },
    ];

    render(
      <LeaderboardView
        {...defaultProps}
        players={singlePlayer}
        currentPlayerId="player-1"
      />
    );

    expect(screen.getByText(/Solo/)).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('handles tied scores', () => {
    const tiedPlayers: Player[] = [
      { id: 'player-1', name: 'Alice', colorIndex: 0, totalScore: 50 },
      { id: 'player-2', name: 'Bob', colorIndex: 1, totalScore: 50 },
    ];

    render(<LeaderboardView {...defaultProps} players={tiedPlayers} currentPlayerId={null} />);

    // Both players should be displayed
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});
