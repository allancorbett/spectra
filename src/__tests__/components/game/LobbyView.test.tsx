import { render, screen, fireEvent } from '@testing-library/react';
import LobbyView from '@/components/game/LobbyView';
import { Player, GameSettings } from '@/lib/types';

// Mock qrcode.react
jest.mock('qrcode.react', () => ({
  QRCodeSVG: () => <div data-testid="qr-code">QR Code</div>,
}));

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

describe('LobbyView', () => {
  const mockPlayers: Player[] = [
    { id: 'host-1', name: 'Bob', colorIndex: 0, totalScore: 0 },
    { id: 'player-2', name: 'Alice', colorIndex: 1, totalScore: 0 },
  ];

  const mockSettings: GameSettings = {
    mode: 'together',
    complexity: 'normal',
    timerEnabled: true,
  };

  const defaultProps = {
    gameId: 'ABC123',
    players: mockPlayers,
    settings: mockSettings,
    currentPlayerId: 'host-1',
    hostId: 'host-1',
    isHost: true,
    onStart: jest.fn(),
    onLeave: jest.fn(),
    onUpdateSettings: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays game lobby header', () => {
    render(<LobbyView {...defaultProps} />);
    expect(screen.getByText('Game Lobby')).toBeInTheDocument();
  });

  it('displays player count', () => {
    render(<LobbyView {...defaultProps} />);
    expect(screen.getByText('2/24 players')).toBeInTheDocument();
  });

  it('displays game code for host', () => {
    render(<LobbyView {...defaultProps} />);
    expect(screen.getByText('ABC123')).toBeInTheDocument();
  });

  it('shows QR code for host', () => {
    render(<LobbyView {...defaultProps} />);
    expect(screen.getByTestId('qr-code')).toBeInTheDocument();
  });

  it('copies game URL when clicking on game code', async () => {
    render(<LobbyView {...defaultProps} />);

    const codeElement = screen.getByText('ABC123');
    fireEvent.click(codeElement.parentElement!);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('shows "Copied!" message after copying', async () => {
    render(<LobbyView {...defaultProps} />);

    const codeElement = screen.getByText('ABC123');
    fireEvent.click(codeElement.parentElement!);

    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('does not show game code/QR for non-host', () => {
    render(<LobbyView {...defaultProps} isHost={false} />);

    expect(screen.queryByText('Share this code to invite players')).not.toBeInTheDocument();
    expect(screen.queryByTestId('qr-code')).not.toBeInTheDocument();
  });

  it('shows start game button for host with enough players', () => {
    render(<LobbyView {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();
  });

  it('disables start button when not enough players', () => {
    const singlePlayer = [
      { id: 'host-1', name: 'Bob', colorIndex: 0, totalScore: 0 },
    ];
    render(<LobbyView {...defaultProps} players={singlePlayer} />);
    const startButton = screen.getByRole('button', { name: /need \d+ more player/i });
    expect(startButton).toBeDisabled();
  });

  it('calls onStart when start button clicked', () => {
    render(<LobbyView {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start Game' }));

    expect(defaultProps.onStart).toHaveBeenCalled();
  });

  it('shows cancel button for host', () => {
    render(<LobbyView {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Cancel Game' })).toBeInTheDocument();
  });

  it('calls onLeave when cancel button clicked', () => {
    render(<LobbyView {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel Game' }));

    expect(defaultProps.onLeave).toHaveBeenCalled();
  });

  it('shows waiting message for non-host', () => {
    render(<LobbyView {...defaultProps} isHost={false} />);
    expect(screen.getByText('Waiting for host to start the game...')).toBeInTheDocument();
  });

  it('shows leave button for non-host', () => {
    render(<LobbyView {...defaultProps} isHost={false} />);
    expect(screen.getByRole('button', { name: 'Leave Game' })).toBeInTheDocument();
  });

  it('calls onLeave when leave button clicked', () => {
    render(<LobbyView {...defaultProps} isHost={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Leave Game' }));

    expect(defaultProps.onLeave).toHaveBeenCalled();
  });

  it('displays player list', () => {
    render(<LobbyView {...defaultProps} />);
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
