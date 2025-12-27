import { render, screen, fireEvent } from '@testing-library/react';
import ColorGrid from '@/components/ColorGrid';
import { Guess, HUE_SEGMENTS, CHROMA_LEVELS } from '@/lib/types';

describe('ColorGrid', () => {
  it('renders scroll hint', () => {
    render(<ColorGrid />);
    expect(screen.getByText('Scroll to explore colors')).toBeInTheDocument();
  });

  it('renders correct number of cells', () => {
    const { container } = render(<ColorGrid />);
    // Grid is HUE_SEGMENTS × CHROMA_LEVELS = 48 × 12 = 576 cells
    const cells = container.querySelectorAll('.grid > div');
    expect(cells).toHaveLength(HUE_SEGMENTS * CHROMA_LEVELS);
  });

  it('calls onCellClick when cell is clicked', () => {
    const handleClick = jest.fn();
    const { container } = render(<ColorGrid onCellClick={handleClick} />);

    const firstCell = container.querySelector('.grid > div');
    fireEvent.click(firstCell!);

    expect(handleClick).toHaveBeenCalledTimes(1);
    // First cell is hue=0, chroma=CHROMA_LEVELS-1 (starts from top = high chroma)
    expect(handleClick).toHaveBeenCalledWith(0, CHROMA_LEVELS - 1);
  });

  it('does not call onCellClick when disabled', () => {
    const handleClick = jest.fn();
    const { container } = render(
      <ColorGrid onCellClick={handleClick} disabled={true} />
    );

    const firstCell = container.querySelector('.grid > div');
    fireEvent.click(firstCell!);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows target indicator when showTarget is true', () => {
    const { container } = render(
      <ColorGrid
        targetHue={5}
        targetSaturation={10}
        showTarget={true}
      />
    );

    // Target cell should have ring-2 class
    const targetCell = container.querySelector('.ring-2.ring-white');
    expect(targetCell).toBeInTheDocument();
  });

  it('shows selection checkmark when cell is selected', () => {
    const { container } = render(
      <ColorGrid
        selectedHue={5}
        selectedSaturation={10}
      />
    );

    // Should have SVG checkmark
    const checkmark = container.querySelector('svg');
    expect(checkmark).toBeInTheDocument();
  });

  it('renders guess markers', () => {
    const guesses: Guess[] = [
      {
        playerId: 'player1',
        roundNumber: 1,
        guessNumber: 1,
        hue: 5,
        saturation: 10,
        lockedIn: true,
      },
    ];

    const playerColorMap = new Map([['player1', 0]]);
    const playerNameMap = new Map([['player1', 'Alice']]);

    render(
      <ColorGrid
        guesses={guesses}
        playerColorMap={playerColorMap}
        playerNameMap={playerNameMap}
      />
    );

    // Should show player initial
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows count when multiple guesses on same cell', () => {
    const guesses: Guess[] = [
      {
        playerId: 'player1',
        roundNumber: 1,
        guessNumber: 1,
        hue: 5,
        saturation: 10,
        lockedIn: true,
      },
      {
        playerId: 'player2',
        roundNumber: 1,
        guessNumber: 1,
        hue: 5,
        saturation: 10,
        lockedIn: true,
      },
    ];

    render(<ColorGrid guesses={guesses} />);

    // Should show "2" for overlapping guesses
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('highlights best guess with gold border', () => {
    const guesses: Guess[] = [
      {
        playerId: 'player1',
        roundNumber: 1,
        guessNumber: 1,
        hue: 5,
        saturation: 10,
        lockedIn: true,
        distance: 10,
      },
    ];

    const playerColorMap = new Map([['player1', 0]]);
    const playerNameMap = new Map([['player1', 'Alice']]);

    const { container } = render(
      <ColorGrid
        guesses={guesses}
        playerColorMap={playerColorMap}
        playerNameMap={playerNameMap}
        highlightBestGuess={true}
      />
    );

    // Best guess should have yellow border
    const bestGuess = container.querySelector('.border-yellow-400');
    expect(bestGuess).toBeInTheDocument();
  });

  it('applies cursor-pointer when clickable', () => {
    const { container } = render(<ColorGrid onCellClick={() => {}} />);

    const cell = container.querySelector('.grid > div');
    expect(cell).toHaveClass('cursor-pointer');
  });

  it('does not apply cursor-pointer when no click handler', () => {
    const { container } = render(<ColorGrid />);

    const cell = container.querySelector('.grid > div');
    expect(cell).not.toHaveClass('cursor-pointer');
  });
});
