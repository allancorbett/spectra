import { render, screen, fireEvent } from '@testing-library/react';
import GuessingView from '@/components/game/GuessingView';
import { Guess } from '@/lib/types';

describe('GuessingView', () => {
  const defaultProps = {
    roundNumber: 1,
    guessNumber: 1 as const,
    complexity: 'normal' as const,
    selectedHue: null,
    selectedSaturation: null,
    hasLockedIn: false,
    displayGuesses: [] as Guess[],
    playerColorMap: new Map<string, number>(),
    playerNameMap: new Map<string, string>(),
    lockedInCount: 0,
    guesserCount: 3,
    timerEnabled: false,
    timerPercent: 100,
    timeLeft: null,
    onCellClick: jest.fn(),
    onLockIn: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays round number', () => {
    render(<GuessingView {...defaultProps} />);
    expect(screen.getByText('Round 1')).toBeInTheDocument();
  });

  it('displays first guess prompt', () => {
    render(<GuessingView {...defaultProps} />);
    expect(screen.getByText('Place your first guess')).toBeInTheDocument();
  });

  it('displays second guess prompt', () => {
    render(<GuessingView {...defaultProps} guessNumber={2} />);
    expect(screen.getByText('Place your second guess')).toBeInTheDocument();
  });

  it('displays waiting message when locked in', () => {
    render(<GuessingView {...defaultProps} hasLockedIn={true} />);
    expect(screen.getByText('Waiting for others...')).toBeInTheDocument();
  });

  it('displays lock in button', () => {
    render(<GuessingView {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Lock In' })).toBeInTheDocument();
  });

  it('disables lock in button when no selection', () => {
    render(<GuessingView {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Lock In' })).toBeDisabled();
  });

  it('enables lock in button when selection made', () => {
    render(<GuessingView {...defaultProps} selectedHue={5} selectedSaturation={10} />);
    expect(screen.getByRole('button', { name: 'Lock In' })).not.toBeDisabled();
  });

  it('calls onLockIn when lock in button clicked', () => {
    render(<GuessingView {...defaultProps} selectedHue={5} selectedSaturation={10} />);
    fireEvent.click(screen.getByRole('button', { name: 'Lock In' }));

    expect(defaultProps.onLockIn).toHaveBeenCalled();
  });

  it('hides lock in button when locked in', () => {
    render(<GuessingView {...defaultProps} hasLockedIn={true} />);
    expect(screen.queryByRole('button', { name: 'Lock In' })).not.toBeInTheDocument();
  });

  it('displays locked in count', () => {
    render(<GuessingView {...defaultProps} lockedInCount={2} guesserCount={4} />);
    expect(screen.getByText('2/4 players locked in')).toBeInTheDocument();
  });

  it('shows timer when enabled', () => {
    render(<GuessingView {...defaultProps} timerEnabled={true} timeLeft={25} />);
    expect(screen.getByText('25s')).toBeInTheDocument();
  });

  it('hides timer when disabled', () => {
    render(<GuessingView {...defaultProps} timerEnabled={false} timeLeft={null} />);
    expect(screen.queryByText(/\d+s/)).not.toBeInTheDocument();
  });

  it('shows color preview when selection made', () => {
    const { container } = render(
      <GuessingView {...defaultProps} selectedHue={12} selectedSaturation={10} />
    );

    // Check for the color preview swatch
    const swatch = container.querySelector('.w-16.h-16.rounded-xl');
    expect(swatch).toBeInTheDocument();
  });

  it('hides color preview when locked in', () => {
    const { container } = render(
      <GuessingView {...defaultProps} selectedHue={12} selectedSaturation={10} hasLockedIn={true} />
    );

    const swatch = container.querySelector('.w-16.h-16.rounded-xl');
    expect(swatch).not.toBeInTheDocument();
  });

  it('renders color grid', () => {
    const { container } = render(<GuessingView {...defaultProps} />);

    // Check that the ColorGrid is rendered (it uses a grid div with many cells)
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });

  it('shows scroll hint for color grid', () => {
    render(<GuessingView {...defaultProps} />);
    expect(screen.getByText('Scroll to explore colors')).toBeInTheDocument();
  });
});
