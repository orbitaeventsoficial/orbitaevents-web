import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StarIcon, { StarPolygon } from '@/app/components/public/StarIcon';

const CANONICAL_POINTS =
  '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2';

describe('StarIcon', () => {
  it('renderitza el polygon canònic dins un svg amb viewBox 0 0 24 24', () => {
    const { container } = render(<StarIcon width="20" height="20" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg?.getAttribute('width')).toBe('20');

    const polygon = container.querySelector('polygon');
    expect(polygon?.getAttribute('points')).toBe(CANONICAL_POINTS);
  });

  it('propaga fill, stroke, strokeWidth i className transparently al svg', () => {
    const { container } = render(
      <StarIcon
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={2}
        className="text-amber-400"
      />,
    );
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('fill')).toBe('currentColor');
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
    expect(svg?.getAttribute('stroke-width')).toBe('2');
    expect(svg?.getAttribute('class')).toBe('text-amber-400');
  });

  it('manté el polygon canònic també quan no es passen props', () => {
    const { container } = render(<StarIcon />);
    const polygon = container.querySelector('polygon');
    expect(polygon?.getAttribute('points')).toBe(CANONICAL_POINTS);
  });
});

describe('StarPolygon', () => {
  it('renderitza només el polygon canònic, sense svg embolcallant', () => {
    const { container } = render(
      <svg viewBox="0 0 24 24">
        <StarPolygon />
      </svg>,
    );
    const polygon = container.querySelector('polygon');
    expect(polygon?.getAttribute('points')).toBe(CANONICAL_POINTS);
    expect(container.querySelectorAll('polygon')).toHaveLength(1);
  });
});
