import { render, screen } from '@testing-library/react';
import WaitingForClueView from '@/components/game/WaitingForClueView';

describe('WaitingForClueView', () => {
  const defaultProps = {
    roundNumber: 1,
    cluePhase: 1 as const,
    mode: 'together' as const,
    clueGiverName: 'Alice',
    currentClue: null,
    timerEnabled: false,
    timeLeft: null,
  };

  describe('Together mode', () => {
    it('displays round number', () => {
      render(<WaitingForClueView {...defaultProps} />);
      expect(screen.getByText('Round 1')).toBeInTheDocument();
    });

    it('displays listen for clue message', () => {
      render(<WaitingForClueView {...defaultProps} />);
      expect(screen.getByText('Listen for the clue!')).toBeInTheDocument();
    });

    it('displays ONE word for first clue phase', () => {
      render(<WaitingForClueView {...defaultProps} cluePhase={1} />);
      expect(screen.getByText('ONE word')).toBeInTheDocument();
    });

    it('displays TWO words for second clue phase', () => {
      render(<WaitingForClueView {...defaultProps} cluePhase={2} />);
      expect(screen.getByText('TWO words')).toBeInTheDocument();
    });

    it('does not display clue giver name in together mode', () => {
      render(<WaitingForClueView {...defaultProps} />);
      expect(screen.queryByText(/Alice/)).not.toBeInTheDocument();
    });

    it('does not display current clue in together mode', () => {
      render(<WaitingForClueView {...defaultProps} currentClue="forest" />);
      // The clue should not be displayed in together mode
      expect(screen.queryByText('"forest"')).not.toBeInTheDocument();
    });
  });

  describe('Remote mode', () => {
    const remoteProps = { ...defaultProps, mode: 'remote' as const };

    it('displays waiting for clue message', () => {
      render(<WaitingForClueView {...remoteProps} />);
      expect(screen.getByText("Waiting for Alice's clue...")).toBeInTheDocument();
    });

    it('displays the clue when received', () => {
      render(<WaitingForClueView {...remoteProps} currentClue="forest" />);
      expect(screen.getByText('The clue is:')).toBeInTheDocument();
      expect(screen.getByText('"forest"')).toBeInTheDocument();
    });

    it('hides waiting message when clue received', () => {
      render(<WaitingForClueView {...remoteProps} currentClue="forest" />);
      expect(screen.queryByText(/Waiting for/)).not.toBeInTheDocument();
    });

    it('displays two word clue', () => {
      render(<WaitingForClueView {...remoteProps} cluePhase={2} currentClue="ocean sunset" />);
      expect(screen.getByText('"ocean sunset"')).toBeInTheDocument();
    });
  });

  describe('Timer', () => {
    it('shows timer when enabled', () => {
      render(<WaitingForClueView {...defaultProps} timerEnabled={true} timeLeft={25} />);
      expect(screen.getByText('25s')).toBeInTheDocument();
    });

    it('hides timer when disabled', () => {
      render(<WaitingForClueView {...defaultProps} timerEnabled={false} timeLeft={null} />);
      expect(screen.queryByText(/\d+s/)).not.toBeInTheDocument();
    });

    it('hides timer when timeLeft is null', () => {
      render(<WaitingForClueView {...defaultProps} timerEnabled={true} timeLeft={null} />);
      expect(screen.queryByText(/\d+s/)).not.toBeInTheDocument();
    });
  });

  it('renders color wheel', () => {
    const { container } = render(<WaitingForClueView {...defaultProps} />);
    // Check for SVG element (ColorWheel renders as SVG)
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
