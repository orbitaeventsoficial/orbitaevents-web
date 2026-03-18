import { describe, it, expect } from 'vitest';

import { deriveFlowStatus } from '@/lib/services/communicationStatusService';

const NOW = new Date('2026-03-01T12:00:00Z');
const YESTERDAY = new Date('2026-02-28T12:00:00Z');
const TWO_DAYS_AGO = new Date('2026-02-27T12:00:00Z');

describe('deriveFlowStatus', () => {
  it('retorna FALTA_ENVIAR si no hi ha logs', () => {
    const result = deriveFlowStatus([], 'quote');

    expect(result.state).toBe('FALTA_ENVIAR');
    expect(result.sentAt).toBeNull();
    expect(result.respondedAt).toBeNull();
    expect(result.lastChannel).toBeNull();
  });

  it('retorna ENVIADO si hi ha COMM_SENT', () => {
    const logs = [
      { action: 'COMM_SENT', createdAt: NOW, details: { flow: 'quote', channel: 'email' } },
    ];

    const result = deriveFlowStatus(logs, 'quote');

    expect(result.state).toBe('ENVIADO');
    expect(result.sentAt).toEqual(NOW);
    expect(result.respondedAt).toBeNull();
    expect(result.lastChannel).toBe('email');
  });

  it('retorna RESPONDIDO si hi ha COMM_RESPONDED', () => {
    const logs = [
      { action: 'COMM_SENT', createdAt: YESTERDAY, details: { flow: 'quote', channel: 'email' } },
      { action: 'COMM_RESPONDED', createdAt: NOW, details: { flow: 'quote' } },
    ];

    const result = deriveFlowStatus(logs, 'quote');

    expect(result.state).toBe('RESPONDIDO');
    expect(result.sentAt).toEqual(YESTERDAY);
    expect(result.respondedAt).toEqual(NOW);
  });

  it('filtra per flow correctament', () => {
    const logs = [
      { action: 'COMM_SENT', createdAt: NOW, details: { flow: 'contract', channel: 'whatsapp' } },
    ];

    const result = deriveFlowStatus(logs, 'quote');

    expect(result.state).toBe('FALTA_ENVIAR');
  });

  it('usa el log més recent per sentAt', () => {
    const logs = [
      { action: 'COMM_SENT', createdAt: TWO_DAYS_AGO, details: { flow: 'quote', channel: 'email' } },
      { action: 'COMM_SENT', createdAt: NOW, details: { flow: 'quote', channel: 'whatsapp' } },
    ];

    const result = deriveFlowStatus(logs, 'quote');

    expect(result.sentAt).toEqual(NOW);
    expect(result.lastChannel).toBe('whatsapp');
  });

  it('gestiona details null', () => {
    const logs = [
      { action: 'COMM_SENT', createdAt: NOW, details: null },
    ];

    const result = deriveFlowStatus(logs, 'quote');

    expect(result.state).toBe('FALTA_ENVIAR');
  });

  it('gestiona details sense flow', () => {
    const logs = [
      { action: 'COMM_SENT', createdAt: NOW, details: { channel: 'email' } },
    ];

    const result = deriveFlowStatus(logs, 'quote');

    expect(result.state).toBe('FALTA_ENVIAR');
  });

  it('gestiona channel absent', () => {
    const logs = [
      { action: 'COMM_SENT', createdAt: NOW, details: { flow: 'quote' } },
    ];

    const result = deriveFlowStatus(logs, 'quote');

    expect(result.state).toBe('ENVIADO');
    expect(result.lastChannel).toBeNull();
  });

  it('ignora accions no rellevants', () => {
    const logs = [
      { action: 'UPDATE', createdAt: NOW, details: { flow: 'quote' } },
      { action: 'DELETE', createdAt: NOW, details: { flow: 'quote' } },
    ];

    const result = deriveFlowStatus(logs, 'quote');

    expect(result.state).toBe('FALTA_ENVIAR');
  });
});
