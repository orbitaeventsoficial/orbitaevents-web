import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockReadFile } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
}));

vi.mock('fs', () => ({
  __esModule: true,
  default: {
    promises: {
      readFile: mockReadFile,
    },
  },
  promises: {
    readFile: mockReadFile,
  },
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import AdminManualPage from '@/app/admin/manual/page';

const PROTOCOL_MD = [
  '### Canvi #131 — 2026-04-10 — codex (FET)',
  '**Attribution multi-touch.**',
  '',
  '### Canvi #380 — 2026-04-24 — codex (FET)',
  '**Command palette.**',
].join('\n');

describe('AdminManualPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadFile.mockResolvedValue(PROTOCOL_MD);
  });

  it('renderitza el roadmap pendent amb CTA directe a §6.16', async () => {
    const ui = await AdminManualPage();

    render(ui);

    expect(
      screen.getByRole('heading', { name: 'Marketing Analytics Hub amb integracions externes' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Obrir §6.16 al protocol' })).toHaveAttribute(
      'href',
      '/admin/docs/protocol?seccio=6.16#seccio-6-16',
    );
    expect(screen.getAllByRole('link', { name: 'Anar a Marketing' }).some((link) => (
      link.getAttribute('href') === '/admin/marketing'
    ))).toBe(true);
    expect(screen.queryByRole('link', { name: 'Obrir §6.15 al protocol' })).not.toBeInTheDocument();
    expect(screen.getAllByText('Primer moviment').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Definir client ideal (ICP)').length).toBeGreaterThan(0);
    expect(screen.getByText('Pressupost mínim acceptable')).toBeInTheDocument();
    expect(screen.getByText(/un sol canal actiu/)).toBeInTheDocument();
    expect(screen.getByText('No obrir encara')).toBeInTheDocument();
    expect(screen.getByText(/Sense ICP i proposta clara/)).toBeInTheDocument();
    expect(screen.getByText('Després de la fundació')).toBeInTheDocument();
    expect(screen.getAllByText('Activar xarxa personal').length).toBeGreaterThan(0);
    expect(screen.getByText(/resposta immediata/)).toBeInTheDocument();
    expect(screen.getAllByText('50 contactes avisats').length).toBeGreaterThan(0);
    expect(screen.getByText('Pla de 14 dies')).toBeInTheDocument();
    expect(screen.getByText('Triar un sol canal gratuït')).toBeInTheDocument();
    expect(screen.getByText('Bloqueig de canal actiu')).toBeInTheDocument();
    expect(screen.getByText('Canal actiu ara: xarxa personal')).toBeInTheDocument();
    expect(screen.getByText(/No obrir SEO, Social, Partners ni Ads/)).toBeInTheDocument();
    expect(screen.getByText('Només fer ara')).toBeInTheDocument();
    expect(screen.getByText('No canviar encara')).toBeInTheDocument();
    expect(screen.getByText('Sortida del bloqueig')).toBeInTheDocument();
    expect(screen.getByText(/50 contactes avisats amb resultat registrat/)).toBeInTheDocument();
    expect(screen.getByText('Matriu d’un sol canal')).toBeInTheDocument();
    expect(screen.getAllByText(/Enviar el missatge a 50 contactes reals/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/3 converses comercials obertes/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Obrir Social' }).some((link) => (
      link.getAttribute('href') === '/admin/social'
    ))).toBe(true);
    expect(screen.getByText('Tracker de proves Fase 0')).toBeInTheDocument();
    expect(screen.getByText(/Fitxa escrita amb event prioritari/)).toBeInTheDocument();
    expect(screen.getByText(/Google Maps i Google Business Profile/)).toBeInTheDocument();
    expect(screen.getByText(/ruta clara cap al lead/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ritme operatiu' })).toBeInTheDocument();
    expect(screen.getByText('Cada matí')).toBeInTheDocument();
    expect(screen.getByText('Treballar cues, no memòria')).toBeInTheDocument();
    expect(screen.getAllByText('Tancat quan').length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText(/primer bloc de feina triat/)).toBeInTheDocument();
    expect(screen.getByText(/no escalar pressupost/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Obrir Dashboard' })).toHaveAttribute('href', '/admin');
    expect(screen.getAllByRole('link', { name: 'Obrir Reporting' }).some((link) => (
      link.getAttribute('href') === '/admin/reporting'
    ))).toBe(true);
    expect(screen.getByRole('heading', { name: 'Sistema operatiu de punta a punta' })).toBeInTheDocument();
    expect(screen.getAllByText('Captar demanda').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Pressupostar amb marge').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Reactivar i generar recurrència').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('El sistema llegeix').length).toBeGreaterThanOrEqual(6);
    expect(screen.getAllByText('Decisió manual').length).toBeGreaterThanOrEqual(6);
    expect(screen.getByText(/Lead amb origen clar/)).toBeInTheDocument();
    expect(screen.getByText(/Reiniciar el cicle/)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Obrir Entrades' }).some((link) => (
      link.getAttribute('href') === '/admin/leads'
    ))).toBe(true);
    expect(screen.getByRole('heading', { name: 'Punts de control del flux' })).toBeInTheDocument();
    expect(screen.getAllByText(/Gate pas/).length).toBeGreaterThanOrEqual(6);
    expect(screen.getByText('No surt proposta sense marge')).toBeInTheDocument();
    expect(screen.getAllByText(/Comprovació abans d’avançar/).length).toBeGreaterThanOrEqual(6);
    expect(screen.getAllByText('Risc si se salta').length).toBeGreaterThanOrEqual(6);
    expect(screen.getByText(/Podria executar aquest esdeveniment demà/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Checklist de pas' })).toBeInTheDocument();
    expect(screen.getByText('Demanda capturada i preparada per qualificar')).toBeInTheDocument();
    expect(screen.getByText('marge mínim validat abans d’enviar')).toBeInTheDocument();
    expect(screen.getAllByText(/Bloquejat si/).length).toBeGreaterThanOrEqual(6);
    expect(screen.getByRole('heading', { name: 'Matriu d’excepcions' })).toBeInTheDocument();
    expect(screen.getAllByText(/Excepció pas/).length).toBeGreaterThanOrEqual(6);
    expect(screen.getByText(/Lead sense origen/)).toBeInTheDocument();
    expect(screen.getByText(/No avançar fins que el resultat econòmic/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Evidències de tancament' })).toBeInTheDocument();
    expect(screen.getAllByText(/Evidència pas/).length).toBeGreaterThanOrEqual(6);
    expect(screen.getByText(/Fitxa de lead amb origen/)).toBeInTheDocument();
    expect(screen.getByText(/El PDF Studio i la preview de pressupost/)).toBeInTheDocument();
    expect(screen.getByText(/Si l’event fos demà/)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Comprovar Finances' }).some((link) => (
      link.getAttribute('href') === '/admin/economia'
    ))).toBe(true);
    expect(screen.getByRole('heading', { name: 'Handoffs entre passos' })).toBeInTheDocument();
    expect(screen.getAllByText(/Artefacte que es lliura/).length).toBeGreaterThanOrEqual(6);
    expect(screen.getAllByText(/Regla d’handoff/).length).toBeGreaterThanOrEqual(6);
    expect(screen.getByText(/Pressupost amb pack, preu, transport, data i marge revisat/)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Reserves' }).some((link) => (
      link.getAttribute('href') === '/admin/bookings'
    ))).toBe(true);
    expect(screen.getAllByText(/Pas 01 · Captar demanda/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Pas 03 · Pressupostar amb marge/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Pas 06 · Reactivar i generar recurrència/).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Cobertura del sistema' })).toBeInTheDocument();
    expect(screen.getAllByText(/eines/).length).toBeGreaterThanOrEqual(6);
    expect(screen.getAllByText('Captació i vendes').length).toBeGreaterThan(0);
  }, 30000);
});
