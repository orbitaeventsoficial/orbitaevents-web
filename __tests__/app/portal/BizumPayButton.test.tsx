import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BizumPayButton from '@/app/[locale]/portal/[token]/payments/BizumPayButton';

const labels = {
  instruction: 'Haz el Bizum al numero siguiente.',
  concept: 'Concepto',
  amount: 'Importe',
  button: 'Ya he hecho el Bizum',
  sending: 'Enviando...',
  successTitle: 'Aviso enviado',
  successBody: 'El equipo lo confirmará pronto.',
  alreadyDeclared: 'Ya notificado',
  errorRetry: 'No se ha podido avisar.',
};

function renderBizumButton(alreadyDeclared = false) {
  return render(
    <BizumPayButton
      token="portal-token"
      paymentType="deposit"
      bizumPhone="600000000"
      amount="300 EUR"
      reference="OE-2026-001"
      accentHex="#22d3ee"
      alreadyDeclared={alreadyDeclared}
      labels={labels}
    />,
  );
}

describe('BizumPayButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra l'etiqueta d'import rebuda del locale del portal", () => {
    renderBizumButton();

    expect(screen.getByText('Importe')).toBeInTheDocument();
    expect(screen.getByText('300 EUR')).toBeInTheDocument();
    expect(screen.queryByText('Import')).not.toBeInTheDocument();
  });

  it('anuncia el Bizum ja notificat com a estat', () => {
    renderBizumButton(true);

    expect(screen.getByRole('status')).toHaveTextContent('Aviso enviado');
  });

  it('anuncia lerror de notificació com a alerta', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('network')));

    renderBizumButton();

    fireEvent.click(screen.getByRole('button', { name: 'Ya he hecho el Bizum' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se ha podido avisar.'));
  });

  it('no mostra errors desconeguts del backend com a text cru', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'INTERNAL_STACK' }),
    }));

    renderBizumButton();

    fireEvent.click(screen.getByRole('button', { name: 'Ya he hecho el Bizum' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se ha podido avisar.'));
    expect(screen.queryByText('INTERNAL_STACK')).not.toBeInTheDocument();
  });
});
