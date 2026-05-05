import { afterEach, describe, expect, it } from 'vitest';
import { emailMatchesToFilter, getInboxToFilter, type EmailMessage } from '@/lib/imap';

function makeEmail(to: { name?: string; address: string }[]): EmailMessage {
  return {
    id: 'imap-1',
    uid: 1,
    messageId: '<test@local>',
    from: { name: '', address: 'sender@example.com' },
    to: to.map((t) => ({ name: t.name ?? '', address: t.address })),
    subject: '(Sense assumpte)',
    date: new Date('2026-05-04T00:00:00Z'),
    bodyText: '',
    bodyHtml: '',
    isRead: false,
    hasAttachments: false,
    attachments: [],
  };
}

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

describe('lib/imap.ts — emailMatchesToFilter()', () => {
  it('accepta qualsevol email quan la llista de permesos és buida (sense filtre)', () => {
    const email = makeEmail([{ address: 'qualsevol@example.com' }]);
    expect(emailMatchesToFilter(email, [])).toBe(true);
  });

  it('accepta email quan una `to[]` coincideix exactament amb la llista', () => {
    const email = makeEmail([{ address: 'info@orbitaevents.com' }]);
    expect(emailMatchesToFilter(email, ['info@orbitaevents.com'])).toBe(true);
  });

  it('rebutja email quan cap `to[]` coincideix', () => {
    const email = makeEmail([{ address: 'ctreball20@gmail.com' }]);
    expect(emailMatchesToFilter(email, ['info@orbitaevents.com'])).toBe(false);
  });

  it('és case-insensitive sobre el camp `to[].address`', () => {
    const email = makeEmail([{ address: 'INFO@OrbitaEvents.COM' }]);
    expect(emailMatchesToFilter(email, ['info@orbitaevents.com'])).toBe(true);
  });

  it('accepta email quan una de diverses `to[]` coincideix amb la llista', () => {
    const email = makeEmail([
      { address: 'cc@example.com' },
      { address: 'info@orbitaevents.com' },
    ]);
    expect(emailMatchesToFilter(email, ['info@orbitaevents.com'])).toBe(true);
  });

  it('rebutja email amb `to[]` buit', () => {
    const email = makeEmail([]);
    expect(emailMatchesToFilter(email, ['info@orbitaevents.com'])).toBe(false);
  });

  it('ignora entrades amb `address` buida o només espais', () => {
    const email = makeEmail([{ address: '   ' }, { address: '' }]);
    expect(emailMatchesToFilter(email, ['info@orbitaevents.com'])).toBe(false);
  });

  it('accepta email quan coincideix amb qualsevol de les adreces permeses', () => {
    const email = makeEmail([{ address: 'reservas@orbitaevents.com' }]);
    expect(
      emailMatchesToFilter(email, ['info@orbitaevents.com', 'reservas@orbitaevents.com']),
    ).toBe(true);
  });

  it('respecta espais residuals al camp `to[].address` retallant-los', () => {
    const email = makeEmail([{ address: '  info@orbitaevents.com  ' }]);
    expect(emailMatchesToFilter(email, ['info@orbitaevents.com'])).toBe(true);
  });
});
