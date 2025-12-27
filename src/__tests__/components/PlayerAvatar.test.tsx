import { render, screen } from '@testing-library/react';
import PlayerAvatar from '@/components/PlayerAvatar';

describe('PlayerAvatar', () => {
  it('renders player initial', () => {
    render(<PlayerAvatar name="Alice" colorIndex={0} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders uppercase initial', () => {
    render(<PlayerAvatar name="bob" colorIndex={0} />);
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { container, rerender } = render(
      <PlayerAvatar name="Test" colorIndex={0} size="sm" />
    );
    expect(container.firstChild).toHaveClass('w-6', 'h-6');

    rerender(<PlayerAvatar name="Test" colorIndex={0} size="md" />);
    expect(container.firstChild).toHaveClass('w-8', 'h-8');

    rerender(<PlayerAvatar name="Test" colorIndex={0} size="lg" />);
    expect(container.firstChild).toHaveClass('w-10', 'h-10');
  });

  it('defaults to medium size', () => {
    const { container } = render(<PlayerAvatar name="Test" colorIndex={0} />);
    expect(container.firstChild).toHaveClass('w-8', 'h-8');
  });

  it('applies background color based on colorIndex', () => {
    const { container } = render(<PlayerAvatar name="Test" colorIndex={0} />);
    expect(container.firstChild).toHaveStyle({ backgroundColor: '#FF6B6B' });
  });

  it('wraps color index for values >= 12', () => {
    const { container } = render(<PlayerAvatar name="Test" colorIndex={12} />);
    expect(container.firstChild).toHaveStyle({ backgroundColor: '#FF6B6B' });
  });
});
