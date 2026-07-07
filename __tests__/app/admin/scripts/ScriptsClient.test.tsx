import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ScriptsClient from '@/app/admin/scripts/ScriptsClient';

const { mockClipboardWriteText } = vi.hoisted(() => ({
  mockClipboardWriteText: vi.fn(),
}));

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

describe('ScriptsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: mockClipboardWriteText },
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('marca nomes la comanda de script que no es pot copiar', async () => {
    mockClipboardWriteText.mockRejectedValueOnce(new Error('clipboard denied'));

    render(<ScriptsClient />);

    const copyButtons = screen.getAllByRole('button', { name: 'Copiar' });
    fireEvent.click(copyButtons[1]);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent("No s'ha pogut copiar la comanda.");
    });

    expect(copyButtons[0]).not.toHaveAttribute('aria-invalid');
    expect(copyButtons[1]).toHaveAttribute('aria-invalid', 'true');
    expect(mockClipboardWriteText).toHaveBeenCalledWith('npx tsx prisma/seed-email-templates.ts');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
