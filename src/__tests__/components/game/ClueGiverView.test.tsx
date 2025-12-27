import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClueGiverView from '@/components/game/ClueGiverView';
import { Player, RoundScore, Guess } from '@/lib/types';

describe('ClueGiverView', () => {
  const mockPlayers: Player[] = [
    { id: 'player-1', name: 'Alice', colorIndex: 0, totalScore: 30 },
    { id: 'player-2', name: 'Bob', colorIndex: 1, totalScore: 50 },
  ];

  const mockRoundScores: RoundScore[] = [
    { playerId: 'player-2', points: 20 },
    { playerId: 'player-1', points: 30 },
  ];

  const defaultProps = {
    state: 'clue-1' as const,
    roundNumber: 1,
    targetHue: 12,
    targetSaturation: 10,
    complexity: 'normal' as const,
    mode: 'together' as const,
    currentClue: null,
    guesses: [] as Guess[],
    players: mockPlayers,
    roundScores: mockRoundScores,
    clueGiverId: 'player-1',
    playerColorMap: new Map<string, number>(),
    playerNameMap: new Map<string, string>(),
    lockedInCount: 0,
    guesserCount: 1,
    timerEnabled: false,
    timerPercent: 100,
    timeLeft: null,
    onAdvancePhase: jest.fn(),
    onSubmitClue: jest.fn().mockResolvedValue({ success: true }),
    onEndGame: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Clue phase', () => {
    it('displays round number', () => {
      render(<ClueGiverView {...defaultProps} />);
      expect(screen.getByText('Round 1')).toBeInTheDocument();
    });

    it('displays ONE word clue title for clue-1', () => {
      render(<ClueGiverView {...defaultProps} state="clue-1" />);
      expect(screen.getByText('Give ONE Word Clue')).toBeInTheDocument();
    });

    it('displays TWO word clue title for clue-2', () => {
      render(<ClueGiverView {...defaultProps} state="clue-2" />);
      expect(screen.getByText('Give TWO Word Clue')).toBeInTheDocument();
    });

    it('shows target color swatch', () => {
      const { container } = render(<ClueGiverView {...defaultProps} />);
      const swatch = container.querySelector('.w-32.h-32.rounded-2xl');
      expect(swatch).toBeInTheDocument();
    });

    it('shows Clue Given button in together mode', () => {
      render(<ClueGiverView {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Clue Given' })).toBeInTheDocument();
    });

    it('calls onAdvancePhase when Clue Given clicked', () => {
      render(<ClueGiverView {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Clue Given' }));
      expect(defaultProps.onAdvancePhase).toHaveBeenCalled();
    });
  });

  describe('Remote mode clue input', () => {
    const remoteProps = { ...defaultProps, mode: 'remote' as const };

    it('shows clue input for remote mode', () => {
      render(<ClueGiverView {...remoteProps} />);
      expect(screen.getByPlaceholderText('e.g., forest')).toBeInTheDocument();
    });

    it('shows TWO word placeholder for clue-2', () => {
      render(<ClueGiverView {...remoteProps} state="clue-2" />);
      expect(screen.getByPlaceholderText('e.g., ocean sunset')).toBeInTheDocument();
    });

    it('shows Send button', () => {
      render(<ClueGiverView {...remoteProps} />);
      expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
    });

    it('disables Send button when input is empty', () => {
      render(<ClueGiverView {...remoteProps} />);
      expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    });

    it('enables Send button when input has text', async () => {
      const user = userEvent.setup();
      render(<ClueGiverView {...remoteProps} />);

      const input = screen.getByPlaceholderText('e.g., forest');
      await user.type(input, 'forest');

      expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled();
    });

    it('calls onSubmitClue when Send clicked', async () => {
      const user = userEvent.setup();
      render(<ClueGiverView {...remoteProps} />);

      const input = screen.getByPlaceholderText('e.g., forest');
      await user.type(input, 'forest');
      await user.click(screen.getByRole('button', { name: 'Send' }));

      expect(remoteProps.onSubmitClue).toHaveBeenCalledWith('forest');
    });

    it('submits on Enter key', async () => {
      const user = userEvent.setup();
      render(<ClueGiverView {...remoteProps} />);

      const input = screen.getByPlaceholderText('e.g., forest');
      await user.type(input, 'forest{Enter}');

      expect(remoteProps.onSubmitClue).toHaveBeenCalledWith('forest');
    });

    it('shows error when submit fails', async () => {
      const onSubmitClue = jest.fn().mockResolvedValue({ success: false, error: 'Too many words' });
      const user = userEvent.setup();
      render(<ClueGiverView {...remoteProps} onSubmitClue={onSubmitClue} />);

      const input = screen.getByPlaceholderText('e.g., forest');
      await user.type(input, 'too many words');
      await user.click(screen.getByRole('button', { name: 'Send' }));

      await waitFor(() => {
        expect(screen.getByText('Too many words')).toBeInTheDocument();
      });
    });

    it('shows current clue when submitted', () => {
      render(<ClueGiverView {...remoteProps} currentClue="forest" />);
      expect(screen.getByText('Current clue: "forest"')).toBeInTheDocument();
    });
  });

  describe('Guessing phase', () => {
    it('shows Players Guessing title', () => {
      render(<ClueGiverView {...defaultProps} state="guess-1" />);
      expect(screen.getByText('Players Guessing...')).toBeInTheDocument();
    });

    it('shows locked in count', () => {
      render(<ClueGiverView {...defaultProps} state="guess-1" lockedInCount={1} guesserCount={2} />);
      expect(screen.getByText('1/2 players locked in')).toBeInTheDocument();
    });

    it('shows timer when enabled', () => {
      render(<ClueGiverView {...defaultProps} state="guess-1" timerEnabled={true} timeLeft={20} />);
      expect(screen.getByText('20s')).toBeInTheDocument();
    });
  });

  describe('Reveal phase', () => {
    it('shows Results title', () => {
      render(<ClueGiverView {...defaultProps} state="reveal" />);
      expect(screen.getByText('Round Results')).toBeInTheDocument();
    });

    it('shows round scores', () => {
      render(<ClueGiverView {...defaultProps} state="reveal" />);
      expect(screen.getByText('Round Scores')).toBeInTheDocument();
    });

    it('shows color wheel', () => {
      const { container } = render(<ClueGiverView {...defaultProps} state="reveal" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('shows Show Leaderboard button', () => {
      render(<ClueGiverView {...defaultProps} state="reveal" />);
      expect(screen.getByRole('button', { name: 'Show Leaderboard' })).toBeInTheDocument();
    });

    it('calls onAdvancePhase when Show Leaderboard clicked', () => {
      render(<ClueGiverView {...defaultProps} state="reveal" />);
      fireEvent.click(screen.getByRole('button', { name: 'Show Leaderboard' }));
      expect(defaultProps.onAdvancePhase).toHaveBeenCalled();
    });
  });

  describe('Leaderboard phase', () => {
    it('shows Leaderboard title', () => {
      render(<ClueGiverView {...defaultProps} state="leaderboard" />);
      expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    });

    it('shows total scores', () => {
      render(<ClueGiverView {...defaultProps} state="leaderboard" />);
      expect(screen.getByText('Total Scores')).toBeInTheDocument();
    });

    it('shows Start Next Round button', () => {
      render(<ClueGiverView {...defaultProps} state="leaderboard" />);
      expect(screen.getByRole('button', { name: 'Start Next Round' })).toBeInTheDocument();
    });

    it('shows End Game button', () => {
      render(<ClueGiverView {...defaultProps} state="leaderboard" />);
      expect(screen.getByRole('button', { name: 'End Game' })).toBeInTheDocument();
    });

    it('calls onAdvancePhase when Start Next Round clicked', () => {
      render(<ClueGiverView {...defaultProps} state="leaderboard" />);
      fireEvent.click(screen.getByRole('button', { name: 'Start Next Round' }));
      expect(defaultProps.onAdvancePhase).toHaveBeenCalled();
    });

    it('calls onEndGame when End Game clicked', () => {
      render(<ClueGiverView {...defaultProps} state="leaderboard" />);
      fireEvent.click(screen.getByRole('button', { name: 'End Game' }));
      expect(defaultProps.onEndGame).toHaveBeenCalled();
    });

    it('does not show target color swatch', () => {
      const { container } = render(<ClueGiverView {...defaultProps} state="leaderboard" />);
      const swatch = container.querySelector('.w-32.h-32.rounded-2xl');
      expect(swatch).not.toBeInTheDocument();
    });
  });

  describe('Timer', () => {
    it('shows timer bar when enabled', () => {
      const { container } = render(<ClueGiverView {...defaultProps} timerEnabled={true} timeLeft={25} timerPercent={83} />);
      // TimerBar is rendered as a div with timer-bar class
      expect(container.querySelector('.timer-bar')).toBeInTheDocument();
    });

    it('hides timer bar when disabled', () => {
      const { container } = render(<ClueGiverView {...defaultProps} timerEnabled={false} />);
      expect(container.querySelector('.timer-bar')).not.toBeInTheDocument();
    });
  });
});
