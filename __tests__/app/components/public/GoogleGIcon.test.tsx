import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GoogleGIcon from '@/app/components/public/GoogleGIcon';

describe('GoogleGIcon', () => {
  it('renderitza els 4 paths canònics del logo Google G amb els colors oficials i en ordre canònic', () => {
    const { container } = render(<GoogleGIcon width="24" height="24" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');

    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(4);

    const fills = Array.from(paths).map((path) => path.getAttribute('fill'));
    expect(fills).toEqual(['#4285F4', '#34A853', '#FBBC05', '#EA4335']);

    Array.from(paths).forEach((path) => {
      const d = path.getAttribute('d');
      expect(d).toMatch(/^[Mm]/);
      expect((d ?? '').length).toBeGreaterThan(40);
    });
  });

  it('propaga props arbitràries (className, aria-hidden, width/height) cap al svg', () => {
    const { container } = render(
      <GoogleGIcon className="w-5 h-5" aria-hidden="true" width="20" height="20" />,
    );
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toBe('w-5 h-5');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('width')).toBe('20');
    expect(svg?.getAttribute('height')).toBe('20');
  });

  it('manté el viewBox 0 0 24 24 fins i tot si el consumer no passa width/height', () => {
    const { container } = render(<GoogleGIcon />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(container.querySelectorAll('path')).toHaveLength(4);
  });
});
