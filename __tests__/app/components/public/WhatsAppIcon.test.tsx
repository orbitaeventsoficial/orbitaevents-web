import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import WhatsAppIcon from '@/app/components/public/WhatsAppIcon';

describe('WhatsAppIcon', () => {
  it('renderitza el path canònic del logo WhatsApp dins un svg amb viewBox 0 0 24 24', () => {
    const { container } = render(<WhatsAppIcon className="w-5 h-5" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg?.getAttribute('fill')).toBe('currentColor');
    expect(svg?.getAttribute('class')).toBe('w-5 h-5');

    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(1);
    const d = paths[0].getAttribute('d');
    expect(d).toMatch(/^M17\.472 14\.382c/);
    expect(d?.length).toBeGreaterThan(800);
  });

  it('permet sobreescriure fill via props (per icones invertides)', () => {
    const { container } = render(<WhatsAppIcon fill="#25D366" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('fill')).toBe('#25D366');
  });

  it('propaga aria-hidden, width i height transparently al svg', () => {
    const { container } = render(
      <WhatsAppIcon aria-hidden="true" width={20} height={20} />,
    );
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('width')).toBe('20');
    expect(svg?.getAttribute('height')).toBe('20');
  });
});
