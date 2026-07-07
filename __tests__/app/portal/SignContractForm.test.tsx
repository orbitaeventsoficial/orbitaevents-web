import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/[locale]/portal/[token]/sign/SignaturePad', () => ({
  SignaturePad: ({ onDataChange, hintText, clearLabel }: {
    onDataChange: (dataUrl: string | null) => void;
    hintText: string;
    clearLabel: string;
  }) => (
    <div>
      <button type="button" onClick={() => onDataChange('data:image/png;base64,abc123')}>
        {hintText}
      </button>
      <button type="button" onClick={() => onDataChange(null)}>
        {clearLabel}
      </button>
    </div>
  ),
}));

import { SignContractForm } from '@/app/[locale]/portal/[token]/sign/SignContractForm';

const messages = {
  signYourName: 'Nom complet',
  signNamePlaceholder: 'Escriu el teu nom',
  signAcceptTerms: 'Accepto signar el contracte',
  signSubmit: 'Signar contracte',
  signSubmitting: 'Signant contracte...',
  signSuccess: 'Contracte signat correctament',
  signSuccessBack: 'Tornar al portal',
  signError: 'No hem pogut signar el contracte',
  signAlreadySigned: 'Aquest contracte ja està signat',
  signNotAvailable: 'Aquest contracte encara no es pot signar',
  signaturePadLabel: 'Signatura manuscrita',
  signaturePadHint: 'Dibuixa la signatura',
  signaturePadClear: 'Neteja',
};

function renderForm() {
  return render(
    <SignContractForm
      token="raw-token"
      locale="ca"
      contractReference="CON-2026-001"
      accentHex="#06b6d4"
      accentBorder="rgba(255,255,255,.2)"
      accentBg="rgba(255,255,255,.08)"
      messages={messages}
    />,
  );
}

describe('SignContractForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true }),
    }));
  });

  it('manté el botó desactivat fins que hi ha nom, acceptació i signatura manuscrita', () => {
    renderForm();

    const button = screen.getByRole('button', { name: 'Signar contracte' });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Nom complet'), { target: { value: 'Maria Garcia' } });
    expect(button).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/Accepto signar el contracte/));
    expect(button).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Dibuixa la signatura' }));
    expect(button).toBeEnabled();
  });

  it('envia el nom net i la signatura capturada a la ruta de signatura', async () => {
    renderForm();

    fireEvent.change(screen.getByLabelText('Nom complet'), { target: { value: '  Maria Garcia  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Dibuixa la signatura' }));
    fireEvent.click(screen.getByLabelText(/Accepto signar el contracte/));
    fireEvent.click(screen.getByRole('button', { name: 'Signar contracte' }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith('/api/portal/raw-token/sign', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedBy: 'Maria Garcia', signatureBlob: 'data:image/png;base64,abc123' }),
      })),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Contracte signat correctament');
    expect(screen.getByRole('link', { name: 'Tornar al portal' })).toHaveAttribute('href', '/ca/portal/raw-token');
  });

  it('mostra el text de carrega localitzat mentre envia la signatura', async () => {
    vi.mocked(fetch).mockReturnValueOnce(new Promise(() => {}) as unknown as Promise<Response>);

    renderForm();

    fireEvent.change(screen.getByLabelText('Nom complet'), { target: { value: 'Maria Garcia' } });
    fireEvent.click(screen.getByRole('button', { name: 'Dibuixa la signatura' }));
    fireEvent.click(screen.getByLabelText(/Accepto signar el contracte/));
    fireEvent.click(screen.getByRole('button', { name: 'Signar contracte' }));

    expect(await screen.findByRole('button', { name: 'Signant contracte...' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: '…' })).not.toBeInTheDocument();
  });

  it('mostra el missatge específic per contracte ja signat', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'ALREADY_SIGNED' }),
    } as unknown as Response);

    renderForm();

    fireEvent.change(screen.getByLabelText('Nom complet'), { target: { value: 'Maria Garcia' } });
    fireEvent.click(screen.getByRole('button', { name: 'Dibuixa la signatura' }));
    fireEvent.click(screen.getByLabelText(/Accepto signar el contracte/));
    fireEvent.click(screen.getByRole('button', { name: 'Signar contracte' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Aquest contracte ja està signat');
  });

  it('no mostra errors desconeguts del backend com a text cru', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'STACK_TRACE_500' }),
    } as unknown as Response);

    renderForm();

    fireEvent.change(screen.getByLabelText('Nom complet'), { target: { value: 'Maria Garcia' } });
    fireEvent.click(screen.getByRole('button', { name: 'Dibuixa la signatura' }));
    fireEvent.click(screen.getByLabelText(/Accepto signar el contracte/));
    fireEvent.click(screen.getByRole('button', { name: 'Signar contracte' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No hem pogut signar el contracte');
    expect(screen.queryByText('STACK_TRACE_500')).not.toBeInTheDocument();
  });

  it('recupera l’estat interactiu si falla la xarxa', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network'));

    renderForm();

    fireEvent.change(screen.getByLabelText('Nom complet'), { target: { value: 'Maria Garcia' } });
    fireEvent.click(screen.getByRole('button', { name: 'Dibuixa la signatura' }));
    fireEvent.click(screen.getByLabelText(/Accepto signar el contracte/));
    fireEvent.click(screen.getByRole('button', { name: 'Signar contracte' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No hem pogut signar el contracte');
    expect(screen.getByRole('button', { name: 'Signar contracte' })).toBeEnabled();
  });
});
