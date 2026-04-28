import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ArrowRightIcon from '@/app/components/public/ArrowRightIcon';

const CANONICAL_PATH = 'M17 8l4 4m0 0l-4 4m4-4H3';

describe('ArrowRightIcon', () => {
  it('renderitza el path canònic dins un svg amb viewBox 0 0 24 24 i defaults', () => {
    const { container } = render(<ArrowRightIcon className="w-4 h-4" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg?.getAttribute('fill')).toBe('none');
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
    expect(svg?.getAttribute('stroke-width')).toBe('2');
    expect(svg?.getAttribute('class')).toBe('w-4 h-4');

    const path = container.querySelector('path');
    expect(path?.getAttribute('d')).toBe(CANONICAL_PATH);
    expect(path?.getAttribute('stroke-linecap')).toBe('round');
    expect(path?.getAttribute('stroke-linejoin')).toBe('round');
  });

  it('permet sobreescriure strokeWidth i width/height via props', () => {
    const { container } = render(
      <ArrowRightIcon width={18} height={18} strokeWidth={2.5} className="text-amber-400" />,
    );
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('18');
    expect(svg?.getAttribute('height')).toBe('18');
    expect(svg?.getAttribute('stroke-width')).toBe('2.5');
    expect(svg?.getAttribute('class')).toBe('text-amber-400');
  });

  it('manté el path canònic també quan no es passen props', () => {
    const { container } = render(<ArrowRightIcon />);
    const path = container.querySelector('path');
    expect(path?.getAttribute('d')).toBe(CANONICAL_PATH);
  });

  it('propaga aria-hidden i altres props arbitràries al svg', () => {
    const { container } = render(<ArrowRightIcon aria-hidden="true" data-testid="arrow" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('data-testid')).toBe('arrow');
  });
});
