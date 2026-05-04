import { afterEach, describe, expect, it } from 'vitest';
import { getInboxToFilter } from '@/lib/imap';

/**
 * Filtre `INBOX_TO_FILTER` per la safata d'entrada.
 *
 * Quan la mateixa bústia IMAP rep mails forwardejats des de varies adreces
 * (ex: info@orbitaevents.com + ctreball20@gmail.com via alies/forwarding),
 * aquesta env permet mostrar només els que ens interessen operativament.
 *
 * Format: llista d'adreces separada per comes, case-insensitive.
 * Buit o no definit: cap filtre (comportament històric).
 */
describe('lib/imap.ts — getInboxToFilter()', () => {
  const original = process.env.INBOX_TO_FILTER;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.INBOX_TO_FILTER;
    } else {
      process.env.INBOX_TO_FILTER = original;
    }
  });

  it('retorna llista buida quan la env no està definida', () => {
    delete process.env.INBOX_TO_FILTER;
    expect(getInboxToFilter()).toEqual([]);
  });

  it('retorna llista buida quan la env està buida', () => {
    process.env.INBOX_TO_FILTER = '';
    expect(getInboxToFilter()).toEqual([]);
  });

  it('parseja una sola adreça i la normalitza a lowercase', () => {
    process.env.INBOX_TO_FILTER = 'INFO@orbitaevents.com';
    expect(getInboxToFilter()).toEqual(['info@orbitaevents.com']);
  });

  it('parseja diverses adreces separades per comes', () => {
    process.env.INBOX_TO_FILTER = 'info@orbitaevents.com,reservas@orbitaevents.com';
    expect(getInboxToFilter()).toEqual([
      'info@orbitaevents.com',
      'reservas@orbitaevents.com',
    ]);
  });

  it('elimina espais i entrades buides', () => {
    process.env.INBOX_TO_FILTER = '  info@orbitaevents.com , , reservas@orbitaevents.com  ';
    expect(getInboxToFilter()).toEqual([
      'info@orbitaevents.com',
      'reservas@orbitaevents.com',
    ]);
  });
});
