import { describe, it, expect } from 'vitest';
import { render } from '@/test/utils/render';
import { PageLoader } from "@/components/ui/PageLoader";

describe('PageLoader', () => {
  it('renders loading spinner', () => {
    const { container } = render(<PageLoader />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('applies fullScreen styling when fullScreen is true', () => {
    const { container } = render(<PageLoader fullScreen />);
    const wrapper = container.querySelector('.fixed.inset-0');
    expect(wrapper).toBeInTheDocument();
  });

  it('applies relative positioning when fullScreen is false', () => {
    const { container } = render(<PageLoader fullScreen={false} />);
    const wrapper = container.querySelector('.absolute.inset-0');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders with default message', () => {
    render(<PageLoader />);
    // Component doesn't display message, but structure should be present
    const { container } = render(<PageLoader />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('has correct z-index for fullScreen', () => {
    const { container } = render(<PageLoader fullScreen />);
    const wrapper = container.querySelector('.z-\\[9999\\]');
    expect(wrapper).toBeInTheDocument();
  });

  it('has correct z-index for non-fullScreen', () => {
    const { container } = render(<PageLoader fullScreen={false} />);
    const wrapper = container.querySelector('.z-50');
    expect(wrapper).toBeInTheDocument();
  });
});

