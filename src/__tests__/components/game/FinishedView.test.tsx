import { render, screen, fireEvent } from '@testing-library/react';
import FinishedView from '@/components/game/FinishedView';
import { Player } from '@/lib/types';

describe('FinishedView', () => {
  const mockPlayers: Player[] = [
    { id: 'player-1', name: 'Alice', colorIndex: 0, totalScore: 50 },
    { id: 'player-2', name: 'Bob', colorIndex: 1, totalScore: 30 },
    { id: 'player-3', name: 'Charlie', colorIndex: 2, totalScore: 70 },
  ];

  const defaultProps = {
    players: mockPlayers,
    currentPlayerId: 'player-1',
    onPlayAgain: jest.fn(),
    onNewGame: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays game over header', () => {
    render(<FinishedView {...defaultProps} />);
    expect(screen.getByText('Game Over!')).toBeInTheDocument();
  });

  it('displays winner name', () => {
    render(<FinishedView {...defaultProps} />);
    expect(screen.getByText('Bob wins!')).toBeInTheDocument();
  });

  it('displays final standings header', () => {
    render(<FinishedView {...defaultProps} />);
    expect(screen.getByText('Final Standings')).toBeInTheDocument();
  });

  it('displays all players', () => {
    render(<FinishedView {...defaultProps} />);
    // Use partial text match since Alice has " (You)" appended
    // Bob appears twice - in the list and in "Bob wins!" so use getAllByText
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getAllByText(/Bob/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Charlie/)).toBeInTheDocument();
  });

  it('sorts players by score (lowest first)', () => {
    render(<FinishedView {...defaultProps} />);

    // Check order by looking at score values
    const scores = screen.getAllByText(/^(30|50|70)$/);
    expect(scores[0]).toHaveTextContent('30'); // Bob
    expect(scores[1]).toHaveTextContent('50'); // Alice
    expect(scores[2]).toHaveTextContent('70'); // Charlie
  });

  it('displays player scores', () => {
    render(<FinishedView {...defaultProps} />);
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
  });

  it('shows trophy emoji for winner', () => {
    render(<FinishedView {...defaultProps} />);
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('shows rank numbers for non-winners', () => {
    render(<FinishedView {...defaultProps} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('marks current player with (You)', () => {
    render(<FinishedView {...defaultProps} />);
    expect(screen.getByText(/\(You\)/)).toBeInTheDocument();
  });

  it('shows Play Again button', () => {
    render(<FinishedView {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Play Again' })).toBeInTheDocument();
  });

  it('shows New Game button', () => {
    render(<FinishedView {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'New Game' })).toBeInTheDocument();
  });

  it('calls onPlayAgain when Play Again clicked', () => {
    render(<FinishedView {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play Again' }));
    expect(defaultProps.onPlayAgain).toHaveBeenCalled();
  });

  it('calls onNewGame when New Game clicked', () => {
    render(<FinishedView {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'New Game' }));
    expect(defaultProps.onNewGame).toHaveBeenCalled();
  });

  it('handles no current player', () => {
    render(<FinishedView {...defaultProps} currentPlayerId={null} />);
    expect(screen.queryByText(/\(You\)/)).not.toBeInTheDocument();
  });

  it('handles single player', () => {
    const singlePlayer: Player[] = [
      { id: 'player-1', name: 'Solo', colorIndex: 0, totalScore: 100 },
    ];

    render(
      <FinishedView
        {...defaultProps}
        players={singlePlayer}
        currentPlayerId="player-1"
      />
    );

    expect(screen.getByText('Solo wins!')).toBeInTheDocument();
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('handles tied scores - first player wins', () => {
    const tiedPlayers: Player[] = [
      { id: 'player-1', name: 'Alice', colorIndex: 0, totalScore: 50 },
      { id: 'player-2', name: 'Bob', colorIndex: 1, totalScore: 50 },
    ];

    render(<FinishedView {...defaultProps} players={tiedPlayers} currentPlayerId={null} />);

    expect(screen.getByText(/wins!/)).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});
