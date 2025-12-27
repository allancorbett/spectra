import { render } from '@testing-library/react';
import TimerBar from '@/components/TimerBar';

describe('TimerBar', () => {
  it('renders with correct width percentage', () => {
    const { container } = render(<TimerBar percent={50} />);
    const fill = container.querySelector('.timer-bar-fill');
    expect(fill).toHaveStyle({ width: '50%' });
  });

  it('renders full width at 100%', () => {
    const { container } = render(<TimerBar percent={100} />);
    const fill = container.querySelector('.timer-bar-fill');
    expect(fill).toHaveStyle({ width: '100%' });
  });

  it('renders empty at 0%', () => {
    const { container } = render(<TimerBar percent={0} />);
    const fill = container.querySelector('.timer-bar-fill');
    expect(fill).toHaveStyle({ width: '0%' });
  });

  it('has timer-bar class on container', () => {
    const { container } = render(<TimerBar percent={50} />);
    expect(container.firstChild).toHaveClass('timer-bar');
  });
});
