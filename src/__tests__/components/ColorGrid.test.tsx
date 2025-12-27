import { render, screen, fireEvent } from '@testing-library/react';
import ColorGrid from '@/components/ColorGrid';
import { Guess } from '@/lib/types';

describe('ColorGrid', () => {
  it('renders scroll hint', () => {
    render(<ColorGrid />);
    expect(screen.getByText('Scroll to explore colors')).toBeInTheDocument();
  });

  it('renders correct number of cells for normal complexity', () => {
    const { container } = render(<ColorGrid complexity="normal" />);
    // Normal = 24 hues × 20 chroma = 480 cells
    const cells = container.querySelectorAll('.grid > div');
    expect(cells).toHaveLength(480);
  });

  it('renders correct number of cells for simple complexity', () => {
    const { container } = render(<ColorGrid complexity="simple" />);
    // Simple = 12 hues × 10 chroma = 120 cells
    const cells = container.querySelectorAll('.grid > div');
    expect(cells).toHaveLength(120);
  });

  it('renders correct number of cells for complex complexity', () => {
    const { container } = render(<ColorGrid complexity="complex" />);
    // Complex = 36 hues × 28 chroma = 1008 cells
    const cells = container.querySelectorAll('.grid > div');
    expect(cells).toHaveLength(1008);
  });

  it('calls onCellClick when cell is clicked', () => {
    const handleClick = jest.fn();
    const { container } = render(
      <ColorGrid onCellClick={handleClick} complexity="simple" />
    );

    const firstCell = container.querySelector('.grid > div');
    fireEvent.click(firstCell!);

    expect(handleClick).toHaveBeenCalledTimes(1);
    // First cell in simple grid is hue=0, chroma=9 (starts from top = high chroma)
    expect(handleClick).toHaveBeenCalledWith(0, 9);
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
        complexity="normal"
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
        complexity="normal"
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
        complexity="normal"
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

    render(
      <ColorGrid
        guesses={guesses}
        complexity="normal"
      />
    );

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
        complexity="normal"
      />
    );

    // Best guess should have yellow border
    const bestGuess = container.querySelector('.border-yellow-400');
    expect(bestGuess).toBeInTheDocument();
  });

  it('applies cursor-pointer when clickable', () => {
    const { container } = render(
      <ColorGrid onCellClick={() => {}} complexity="simple" />
    );

    const cell = container.querySelector('.grid > div');
    expect(cell).toHaveClass('cursor-pointer');
  });

  it('does not apply cursor-pointer when no click handler', () => {
    const { container } = render(<ColorGrid complexity="simple" />);

    const cell = container.querySelector('.grid > div');
    expect(cell).not.toHaveClass('cursor-pointer');
  });
});
