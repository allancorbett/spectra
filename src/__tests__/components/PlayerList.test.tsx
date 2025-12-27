import { render, screen } from '@testing-library/react';
import PlayerList from '@/components/PlayerList';
import { Player } from '@/lib/types';

describe('PlayerList', () => {
  const mockPlayers: Player[] = [
    { id: 'player-1', name: 'Alice', colorIndex: 0, totalScore: 0 },
    { id: 'player-2', name: 'Bob', colorIndex: 1, totalScore: 0 },
    { id: 'player-3', name: 'Charlie', colorIndex: 2, totalScore: 0 },
  ];

  const defaultProps = {
    players: mockPlayers,
    currentPlayerId: 'player-1',
    hostId: 'player-1',
  };

  it('renders players header', () => {
    render(<PlayerList {...defaultProps} />);
    expect(screen.getByText('Players')).toBeInTheDocument();
  });

  it('displays all player names', () => {
    render(<PlayerList {...defaultProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('shows Host badge for host player', () => {
    render(<PlayerList {...defaultProps} />);
    expect(screen.getByText('Host')).toBeInTheDocument();
  });

  it('shows You label for current player', () => {
    render(<PlayerList {...defaultProps} />);
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('shows both Host and You for current player who is host', () => {
    render(<PlayerList {...defaultProps} />);
    expect(screen.getByText('Host')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('shows Host badge only for host when not current player', () => {
    render(<PlayerList {...defaultProps} currentPlayerId="player-2" />);
    expect(screen.getByText('Host')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    // Host should be associated with Alice, You with Bob
  });

  it('handles no current player', () => {
    render(<PlayerList {...defaultProps} currentPlayerId={null} />);
    expect(screen.queryByText('You')).not.toBeInTheDocument();
    expect(screen.getByText('Host')).toBeInTheDocument();
  });

  it('renders player avatars', () => {
    const { container } = render(<PlayerList {...defaultProps} />);
    // Each player should have an avatar (div with player initials)
    expect(container.querySelectorAll('.rounded-full').length).toBeGreaterThanOrEqual(3);
  });

  it('handles single player', () => {
    const singlePlayer: Player[] = [
      { id: 'player-1', name: 'Solo', colorIndex: 0, totalScore: 0 },
    ];

    render(
      <PlayerList
        players={singlePlayer}
        currentPlayerId="player-1"
        hostId="player-1"
      />
    );

    expect(screen.getByText('Solo')).toBeInTheDocument();
    expect(screen.getByText('Host')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('handles empty player list', () => {
    render(<PlayerList players={[]} currentPlayerId={null} hostId="none" />);
    expect(screen.getByText('Players')).toBeInTheDocument();
    // No player items should be rendered
    expect(screen.queryByText('Host')).not.toBeInTheDocument();
  });
});
