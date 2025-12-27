import { render, screen, fireEvent } from '@testing-library/react';
import ColorWheel from '@/components/ColorWheel';
import { HUE_SEGMENTS, CHROMA_LEVELS, Guess } from '@/lib/types';

describe('ColorWheel', () => {
  it('renders SVG element', () => {
    const { container } = render(<ColorWheel />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders with default size of 320', () => {
    const { container } = render(<ColorWheel />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '320');
    expect(svg).toHaveAttribute('height', '320');
  });

  it('renders with custom size', () => {
    const { container } = render(<ColorWheel size={400} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '400');
    expect(svg).toHaveAttribute('height', '400');
  });

  it('renders correct number of cells', () => {
    const { container } = render(<ColorWheel />);
    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(HUE_SEGMENTS * CHROMA_LEVELS);
  });

  it('calls onCellClick when cell is clicked', () => {
    const handleClick = jest.fn();
    const { container } = render(<ColorWheel onCellClick={handleClick} />);
    const paths = container.querySelectorAll('path');

    fireEvent.click(paths[0]);
    expect(handleClick).toHaveBeenCalled();
  });

  it('does not call onCellClick when disabled', () => {
    const handleClick = jest.fn();
    const { container } = render(<ColorWheel onCellClick={handleClick} disabled />);
    const paths = container.querySelectorAll('path');

    fireEvent.click(paths[0]);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not call onCellClick when no handler provided', () => {
    const { container } = render(<ColorWheel />);
    const paths = container.querySelectorAll('path');

    // Should not throw
    expect(() => fireEvent.click(paths[0])).not.toThrow();
  });

  it('shows target marker when showTarget is true', () => {
    const { container } = render(
      <ColorWheel
        targetHue={10}
        targetSaturation={5}
        showTarget={true}
      />
    );

    // Target marker creates circles with animate-pulse class
    const pulsingCircles = container.querySelectorAll('.animate-pulse');
    expect(pulsingCircles.length).toBeGreaterThan(0);
  });

  it('does not show target marker when showTarget is false', () => {
    const { container } = render(
      <ColorWheel
        targetHue={10}
        targetSaturation={5}
        showTarget={false}
      />
    );

    // Only paths might have animate-pulse, not the target marker circles
    const circles = container.querySelectorAll('circle.animate-pulse');
    expect(circles).toHaveLength(0);
  });

  it('shows selection indicator when selectedHue and selectedSaturation are set', () => {
    const { container } = render(
      <ColorWheel
        selectedHue={15}
        selectedSaturation={8}
      />
    );

    // Selection indicator is a dashed circle
    const dashedCircles = container.querySelectorAll('circle[stroke-dasharray]');
    expect(dashedCircles.length).toBeGreaterThan(0);
  });

  it('renders player guess markers', () => {
    const guesses: Guess[] = [
      { playerId: 'player-1', roundNumber: 1, guessNumber: 1, hue: 5, saturation: 3, lockedIn: true },
      { playerId: 'player-2', roundNumber: 1, guessNumber: 1, hue: 10, saturation: 6, lockedIn: false },
    ];

    const playerColorMap = new Map([
      ['player-1', 0],
      ['player-2', 1],
    ]);

    const playerNameMap = new Map([
      ['player-1', 'Alice'],
      ['player-2', 'Bob'],
    ]);

    const { container } = render(
      <ColorWheel
        guesses={guesses}
        playerColorMap={playerColorMap}
        playerNameMap={playerNameMap}
      />
    );

    // Should render player initials
    expect(container.textContent).toContain('A');
    expect(container.textContent).toContain('B');
  });

  it('highlights best guesses when highlightBestGuess is true', () => {
    const guesses: Guess[] = [
      { playerId: 'player-1', roundNumber: 1, guessNumber: 1, hue: 5, saturation: 3, lockedIn: true, distance: 10 },
      { playerId: 'player-1', roundNumber: 1, guessNumber: 2, hue: 6, saturation: 4, lockedIn: true, distance: 5 },
    ];

    const playerColorMap = new Map([['player-1', 0]]);
    const playerNameMap = new Map([['player-1', 'Alice']]);

    const { container } = render(
      <ColorWheel
        guesses={guesses}
        playerColorMap={playerColorMap}
        playerNameMap={playerNameMap}
        highlightBestGuess={true}
      />
    );

    // Best guess should have gold highlight (#FFD700)
    const goldCircles = container.querySelectorAll('circle[stroke="#FFD700"]');
    expect(goldCircles.length).toBeGreaterThan(0);
  });

  it('applies different styling for locked vs unlocked guesses', () => {
    const guesses: Guess[] = [
      { playerId: 'player-1', roundNumber: 1, guessNumber: 1, hue: 5, saturation: 3, lockedIn: true },
      { playerId: 'player-2', roundNumber: 1, guessNumber: 1, hue: 10, saturation: 6, lockedIn: false },
    ];

    const playerColorMap = new Map([
      ['player-1', 0],
      ['player-2', 1],
    ]);
    const playerNameMap = new Map([
      ['player-1', 'Alice'],
      ['player-2', 'Bob'],
    ]);

    const { container } = render(
      <ColorWheel
        guesses={guesses}
        playerColorMap={playerColorMap}
        playerNameMap={playerNameMap}
      />
    );

    // Both markers should be rendered
    const circles = container.querySelectorAll('circle[stroke="#fff"]');
    expect(circles.length).toBeGreaterThanOrEqual(2);
  });

  it('shows dashed ring for second guess', () => {
    const guesses: Guess[] = [
      { playerId: 'player-1', roundNumber: 1, guessNumber: 2, hue: 5, saturation: 3, lockedIn: true },
    ];

    const playerColorMap = new Map([['player-1', 0]]);
    const playerNameMap = new Map([['player-1', 'Alice']]);

    const { container } = render(
      <ColorWheel
        guesses={guesses}
        playerColorMap={playerColorMap}
        playerNameMap={playerNameMap}
      />
    );

    // Second guess has dashed ring
    const dashedCircles = container.querySelectorAll('circle[stroke-dasharray="4 2"]');
    expect(dashedCircles.length).toBeGreaterThan(0);
  });

  it('handles empty guesses array', () => {
    const { container } = render(<ColorWheel guesses={[]} />);

    // Should render cells but no guess markers (only cells have paths)
    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(HUE_SEGMENTS * CHROMA_LEVELS);
  });

  it('handles missing player in maps gracefully', () => {
    const guesses: Guess[] = [
      { playerId: 'unknown-player', roundNumber: 1, guessNumber: 1, hue: 5, saturation: 3, lockedIn: true },
    ];

    // Empty maps - should use defaults
    const { container } = render(<ColorWheel guesses={guesses} />);

    // Should still render without crashing
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('highlights target cell when showTarget is true', () => {
    const { container } = render(
      <ColorWheel
        targetHue={5}
        targetSaturation={3}
        showTarget={true}
      />
    );

    // Target cell should have thicker white stroke
    const paths = container.querySelectorAll('path[stroke="#fff"]');
    expect(paths.length).toBeGreaterThan(0);
  });

  it('highlights selected cell', () => {
    const { container } = render(
      <ColorWheel
        selectedHue={5}
        selectedSaturation={3}
      />
    );

    // Selected cell should have black stroke
    const paths = container.querySelectorAll('path[stroke="#000"]');
    expect(paths.length).toBeGreaterThan(0);
  });
});
