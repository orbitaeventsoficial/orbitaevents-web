import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('client portal post-event feedback', () => {
  it('consumeix clientFeedback carregat en lloc de fer casts al JSX', () => {
    const filePath = path.join(process.cwd(), 'app', '[locale]', 'portal', '[token]', 'page.tsx');
    const source = readFileSync(filePath, 'utf8');
    const postEventStart = source.indexOf('{/* Post-event */}');
    const postEventBlock = source.slice(postEventStart, source.indexOf('</SectionCard>', postEventStart));

    expect(postEventStart).toBeGreaterThan(-1);
    expect(postEventBlock).toContain('booking.clientFeedback ? t.feedbackSent : t.pendingClose');
    expect(postEventBlock).not.toContain('as Record<string, unknown>');
  });
});
