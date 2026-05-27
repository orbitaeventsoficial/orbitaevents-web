/**
 * Carregador tipat de nodemailer/lib/mail-composer.
 *
 * MailComposer és CommonJS i nodemailer no l'exposa amb tipus a la seva
 * declaració `@types/nodemailer`. Encapsulem la importació dinàmica aquí amb
 * un tipus mínim i precís perquè:
 *   1. Els callers (lib/email.ts, /api/admin/inbox/drafts, /api/admin/emails/sent/[id]/append-imap)
 *      no hagin de repetir `as unknown as` ni doubles casts.
 *   2. La capa quedi protegida si una versió futura de nodemailer canvia
 *      l'export (default vs module.exports directe).
 */

import type nodemailer from 'nodemailer';

type Composer = {
  compile: () => { build: (cb: (err: Error | null, msg: Buffer) => void) => void };
};

type ComposerCtor = new (opts: nodemailer.SendMailOptions | Record<string, unknown>) => Composer;

/**
 * Importa MailComposer amb un tipus precís i un fallback estable.
 *
 * nodemailer/lib/mail-composer és CJS. Segons l'entorn d'import dinàmic, el
 * constructor pot estar a `mod.default` (ESM interop) o ser el propi mod
 * (CJS pur). Tractem el resultat com a `unknown` i discriminem per la forma
 * en lloc d'usar double-cast (`as unknown as`), que el QA rebutja.
 */
function isCtor(value: unknown): value is ComposerCtor {
  return typeof value === 'function';
}

function isModuleWithDefault(value: unknown): value is { default: ComposerCtor } {
  return typeof value === 'object' && value !== null
    && 'default' in value
    && typeof (value as { default: unknown }).default === 'function';
}

export async function loadMailComposer(): Promise<ComposerCtor> {
  const mod: unknown = await import('nodemailer/lib/mail-composer');
  if (isModuleWithDefault(mod)) return mod.default;
  if (isCtor(mod)) return mod;
  throw new Error('nodemailer/lib/mail-composer: import inesperat (no és constructor ni té .default)');
}

/** Construeix el MIME RFC822 a partir d'opcions de nodemailer. */
export async function buildMime(opts: nodemailer.SendMailOptions | Record<string, unknown>): Promise<Buffer> {
  const Ctor = await loadMailComposer();
  const composer = new Ctor(opts);
  return new Promise<Buffer>((resolve, reject) => {
    composer.compile().build((err, msg) => (err ? reject(err) : resolve(msg)));
  });
}
