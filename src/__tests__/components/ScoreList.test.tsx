import { render, screen } from '@testing-library/react';
import ScoreList from '@/components/ScoreList';

describe('ScoreList', () => {
  const mockEntries = [
    { id: 'player-1', name: 'Alice', colorIndex: 0, score: 30 },
    { id: 'player-2', name: 'Bob', colorIndex: 1, score: 50 },
    { id: 'player-3', name: 'Charlie', colorIndex: 2, score: 70 },
  ];

  const defaultProps = {
    entries: mockEntries,
  };

  it('displays all entries', () => {
    render(<ScoreList {...defaultProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('displays scores with pts suffix', () => {
    render(<ScoreList {...defaultProps} />);
    expect(screen.getByText('30 pts')).toBeInTheDocument();
    expect(screen.getByText('50 pts')).toBeInTheDocument();
    expect(screen.getByText('70 pts')).toBeInTheDocument();
  });

  it('displays rank numbers', () => {
    render(<ScoreList {...defaultProps} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<ScoreList {...defaultProps} title="Round Scores" />);
    expect(screen.getByText('Round Scores')).toBeInTheDocument();
  });

  it('does not render title when not provided', () => {
    const { container } = render(<ScoreList {...defaultProps} />);
    // Check that no h3 element exists
    expect(container.querySelector('h3')).not.toBeInTheDocument();
  });

  it('shows trophy for first place when showTrophy is true', () => {
    render(<ScoreList {...defaultProps} showTrophy={true} />);
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('does not show trophy when showTrophy is false', () => {
    render(<ScoreList {...defaultProps} showTrophy={false} />);
    expect(screen.queryByText('🏆')).not.toBeInTheDocument();
  });

  it('marks entry with (You) when isYou is true', () => {
    const entriesWithYou = [
      { id: 'player-1', name: 'Alice', colorIndex: 0, score: 30, isYou: true },
      { id: 'player-2', name: 'Bob', colorIndex: 1, score: 50 },
    ];

    render(<ScoreList entries={entriesWithYou} />);
    expect(screen.getByText(/Alice.*\(You\)/)).toBeInTheDocument();
  });

  it('does not show (You) for entries without isYou', () => {
    render(<ScoreList {...defaultProps} />);
    expect(screen.queryByText(/\(You\)/)).not.toBeInTheDocument();
  });

  it('shows badge when provided', () => {
    const entriesWithBadge = [
      { id: 'player-1', name: 'Alice', colorIndex: 0, score: 30, badge: 'Best' },
    ];

    render(<ScoreList entries={entriesWithBadge} />);
    expect(screen.getByText('Best')).toBeInTheDocument();
  });

  it('renders player avatars', () => {
    const { container } = render(<ScoreList {...defaultProps} />);
    expect(container.querySelectorAll('.rounded-full').length).toBeGreaterThanOrEqual(3);
  });

  it('handles empty entries list', () => {
    render(<ScoreList entries={[]} title="No Scores" />);
    expect(screen.getByText('No Scores')).toBeInTheDocument();
  });

  it('handles single entry', () => {
    const singleEntry = [
      { id: 'player-1', name: 'Solo', colorIndex: 0, score: 100 },
    ];

    render(<ScoreList entries={singleEntry} showTrophy={true} />);
    expect(screen.getByText('Solo')).toBeInTheDocument();
    expect(screen.getByText('🏆')).toBeInTheDocument();
    expect(screen.getByText('100 pts')).toBeInTheDocument();
  });
});
