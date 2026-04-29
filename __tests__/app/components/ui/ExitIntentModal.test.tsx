import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ExitIntentModal from '@/app/components/ui/ExitIntentModal';
import { WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';

describe('ExitIntentModal', () => {
  const originalInnerWidth = window.innerWidth;
  const openSpy = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('open', openSpy);
    sessionStorage.clear();
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1280,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    sessionStorage.clear();
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: originalInnerWidth,
      writable: true,
    });
    openSpy.mockReset();
  });

  it('opens the canonical WhatsApp URL when exit intent triggers', () => {
    render(<ExitIntentModal />);

    vi.advanceTimersByTime(3001);
    fireEvent(
      document,
      new MouseEvent('mouseleave', {
        bubbles: true,
        clientY: 0,
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Escriu-nos per WhatsApp' }));

    expect(openSpy).toHaveBeenCalledWith(
      WHATSAPP_URL_WITH_MESSAGE('Hola! M\'agradaria rebre informació sobre els vostres serveis.'),
      '_blank',
      'noopener,noreferrer',
    );
  });
});
