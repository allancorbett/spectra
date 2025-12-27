import { render, screen, fireEvent } from '@testing-library/react';
import GameSettings from '@/components/game/GameSettings';
import { GameSettings as GameSettingsType } from '@/lib/types';

describe('GameSettings', () => {
  const defaultSettings: GameSettingsType = {
    mode: 'together',
    complexity: 'normal',
    timerEnabled: true,
  };

  const defaultProps = {
    settings: defaultSettings,
    isHost: true,
    onUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Host view', () => {
    it('renders settings header', () => {
      render(<GameSettings {...defaultProps} />);
      expect(screen.getByText('Game Settings')).toBeInTheDocument();
    });

    it('shows mode selection buttons', () => {
      render(<GameSettings {...defaultProps} />);
      expect(screen.getByText('Together')).toBeInTheDocument();
      expect(screen.getByText('Remote')).toBeInTheDocument();
    });

    it('shows complexity selection buttons', () => {
      render(<GameSettings {...defaultProps} />);
      expect(screen.getByText('Simple')).toBeInTheDocument();
      expect(screen.getByText('Normal')).toBeInTheDocument();
      expect(screen.getByText('Complex')).toBeInTheDocument();
    });

    it('shows timer toggle', () => {
      render(<GameSettings {...defaultProps} />);
      expect(screen.getByText('30s Timer')).toBeInTheDocument();
    });

    it('calls onUpdate when mode is changed to remote', () => {
      render(<GameSettings {...defaultProps} />);
      fireEvent.click(screen.getByText('Remote'));

      expect(defaultProps.onUpdate).toHaveBeenCalledWith({ mode: 'remote' });
    });

    it('calls onUpdate when mode is changed to together', () => {
      render(<GameSettings {...defaultProps} settings={{ ...defaultSettings, mode: 'remote' }} />);
      fireEvent.click(screen.getByText('Together'));

      expect(defaultProps.onUpdate).toHaveBeenCalledWith({ mode: 'together' });
    });

    it('calls onUpdate when complexity is changed to simple', () => {
      render(<GameSettings {...defaultProps} />);
      fireEvent.click(screen.getByText('Simple'));

      expect(defaultProps.onUpdate).toHaveBeenCalledWith({ complexity: 'simple' });
    });

    it('calls onUpdate when complexity is changed to complex', () => {
      render(<GameSettings {...defaultProps} />);
      fireEvent.click(screen.getByText('Complex'));

      expect(defaultProps.onUpdate).toHaveBeenCalledWith({ complexity: 'complex' });
    });

    it('calls onUpdate when timer is toggled off', () => {
      render(<GameSettings {...defaultProps} />);

      // Click the toggle button
      const toggleButton = screen.getByRole('button', { name: '' });
      fireEvent.click(toggleButton);

      expect(defaultProps.onUpdate).toHaveBeenCalledWith({ timerEnabled: false });
    });

    it('calls onUpdate when timer is toggled on', () => {
      render(<GameSettings {...defaultProps} settings={{ ...defaultSettings, timerEnabled: false }} />);

      const toggleButton = screen.getByRole('button', { name: '' });
      fireEvent.click(toggleButton);

      expect(defaultProps.onUpdate).toHaveBeenCalledWith({ timerEnabled: true });
    });

    it('shows color counts for complexity levels', () => {
      render(<GameSettings {...defaultProps} />);
      expect(screen.getByText('120')).toBeInTheDocument(); // Simple
      expect(screen.getByText('480')).toBeInTheDocument(); // Normal
      expect(screen.getByText('1008')).toBeInTheDocument(); // Complex
    });
  });

  describe('Non-host view', () => {
    const nonHostProps = { ...defaultProps, isHost: false };

    it('shows read-only settings', () => {
      render(<GameSettings {...nonHostProps} />);
      expect(screen.getByText('Game Settings')).toBeInTheDocument();
    });

    it('displays mode setting', () => {
      render(<GameSettings {...nonHostProps} />);
      expect(screen.getByText('Mode:')).toBeInTheDocument();
      expect(screen.getByText('Together (same room)')).toBeInTheDocument();
    });

    it('displays remote mode correctly', () => {
      render(<GameSettings {...nonHostProps} settings={{ ...defaultSettings, mode: 'remote' }} />);
      expect(screen.getByText('Remote (typed clues)')).toBeInTheDocument();
    });

    it('displays colors setting with count', () => {
      render(<GameSettings {...nonHostProps} />);
      expect(screen.getByText('Colors:')).toBeInTheDocument();
      expect(screen.getByText('normal (480)')).toBeInTheDocument();
    });

    it('displays timer setting', () => {
      render(<GameSettings {...nonHostProps} />);
      expect(screen.getByText('Timer:')).toBeInTheDocument();
      expect(screen.getByText('30 seconds')).toBeInTheDocument();
    });

    it('displays timer off when disabled', () => {
      render(<GameSettings {...nonHostProps} settings={{ ...defaultSettings, timerEnabled: false }} />);
      expect(screen.getByText('Off')).toBeInTheDocument();
    });

    it('does not show mode selection buttons', () => {
      render(<GameSettings {...nonHostProps} />);
      expect(screen.queryByText('Same room')).not.toBeInTheDocument();
      expect(screen.queryByText('Type clues')).not.toBeInTheDocument();
    });
  });
});
