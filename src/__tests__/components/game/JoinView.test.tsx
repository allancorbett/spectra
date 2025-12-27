import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JoinView from '@/components/game/JoinView';

describe('JoinView', () => {
  const defaultProps = {
    gameId: 'ABC123',
    playerCount: 3,
    onJoin: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays game code', () => {
    render(<JoinView {...defaultProps} />);
    expect(screen.getByText('ABC123')).toBeInTheDocument();
  });

  it('displays player count', () => {
    render(<JoinView {...defaultProps} />);
    expect(screen.getByText('3 player(s) waiting')).toBeInTheDocument();
  });

  it('calls onJoin with trimmed name', async () => {
    const user = userEvent.setup();
    render(<JoinView {...defaultProps} />);

    const input = screen.getByPlaceholderText('Your Name');
    await user.type(input, '  Alice  ');

    const joinButton = screen.getByRole('button', { name: /join game/i });
    await user.click(joinButton);

    expect(defaultProps.onJoin).toHaveBeenCalledWith('Alice');
  });

  it('shows error from failed join', async () => {
    const onJoin = jest.fn().mockResolvedValue({ success: false, error: 'Name already taken' });
    const user = userEvent.setup();
    render(<JoinView {...defaultProps} onJoin={onJoin} />);

    const input = screen.getByPlaceholderText('Your Name');
    await user.type(input, 'Alice');

    const joinButton = screen.getByRole('button', { name: /join game/i });
    await user.click(joinButton);

    expect(await screen.findByText('Name already taken')).toBeInTheDocument();
  });

  it('shows loading state while joining', async () => {
    const slowJoin = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );
    const user = userEvent.setup();
    render(<JoinView {...defaultProps} onJoin={slowJoin} />);

    const input = screen.getByPlaceholderText('Your Name');
    await user.type(input, 'Alice');

    const joinButton = screen.getByRole('button', { name: /join game/i });
    await user.click(joinButton);

    expect(screen.getByText('Joining...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Joining...')).not.toBeInTheDocument();
    });
  });

  it('submits on Enter key', async () => {
    const user = userEvent.setup();
    render(<JoinView {...defaultProps} />);

    const input = screen.getByPlaceholderText('Your Name');
    await user.type(input, 'Alice{Enter}');

    expect(defaultProps.onJoin).toHaveBeenCalledWith('Alice');
  });

  it('truncates name to 16 characters', async () => {
    const user = userEvent.setup();
    render(<JoinView {...defaultProps} />);

    const input = screen.getByPlaceholderText('Your Name');
    await user.type(input, 'ThisIsAVeryLongNameThatShouldBeTruncated');

    expect(input).toHaveValue('ThisIsAVeryLongN');
  });

  it('disables join button when name is empty', () => {
    render(<JoinView {...defaultProps} />);

    const joinButton = screen.getByRole('button', { name: /join game/i });
    expect(joinButton).toBeDisabled();
  });

  it('enables join button when name is entered', async () => {
    const user = userEvent.setup();
    render(<JoinView {...defaultProps} />);

    const input = screen.getByPlaceholderText('Your Name');
    await user.type(input, 'Alice');

    const joinButton = screen.getByRole('button', { name: /join game/i });
    expect(joinButton).not.toBeDisabled();
  });
});
