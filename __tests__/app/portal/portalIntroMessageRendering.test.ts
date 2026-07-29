import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('client portal intro message', () => {
  it('mostra el missatge personalitzat amb fallback localitzat al hub', () => {
    const filePath = path.join(process.cwd(), 'app', '[locale]', 'portal', '[token]', 'page.tsx');
    const source = readFileSync(filePath, 'utf8');
    const heroStart = source.indexOf('const customerName =');
    const heroEnd = source.indexOf('const eventDateObj', heroStart);
    const heroSetup = source.slice(heroStart, heroEnd);
    const introStart = source.indexOf('{introText}');
    const introBlock = source.slice(source.lastIndexOf('<p', introStart), source.indexOf('</p>', introStart));

    expect(heroSetup).toContain(
      'const introText = getClientPortalPersonalizedText(personalization.introMessage, t.defaultIntro);',
    );
    expect(introStart).toBeGreaterThan(-1);
    expect(introBlock).toContain('max-w-xl');
    expect(introBlock).toContain('text-white/55');
  });
});
