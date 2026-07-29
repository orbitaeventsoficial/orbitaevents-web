import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('client portal post-event email source', () => {
  it('consumeix el flag canònic postEventEmailSent en lloc de ClientFeedback', () => {
    const filePath = path.join(process.cwd(), 'app', '[locale]', 'portal', '[token]', 'page.tsx');
    const source = readFileSync(filePath, 'utf8');
    const postEventStart = source.indexOf('{/* Post-event */}');
    const postEventBlock = source.slice(postEventStart, source.indexOf('</SectionCard>', postEventStart));

    expect(postEventStart).toBeGreaterThan(-1);
    expect(postEventBlock).toContain('booking.postEventEmailSent ? t.postEventEmailSent : t.postEventEmailPending');
    expect(postEventBlock).not.toContain('booking.clientFeedback ? t.postEventEmailSent : t.postEventEmailPending');
    expect(postEventBlock).not.toContain('t.feedbackSent');
    expect(postEventBlock).not.toContain('t.pendingClose');
    expect(postEventBlock).not.toContain('as Record<string, unknown>');
  });

  it('fa servir el mateix flag canònic al resum de timeline post-event', () => {
    const filePath = path.join(process.cwd(), 'app', '[locale]', 'portal', '[token]', 'page.tsx');
    const source = readFileSync(filePath, 'utf8');
    const timelineStart = source.indexOf('{/* Timeline */}');
    const timelineBlock = source.slice(timelineStart, source.indexOf('{/* Travel */}', timelineStart));

    expect(timelineStart).toBeGreaterThan(-1);
    expect(source).toContain('const portalPostEventTimelineStatus = booking.postEventReport');
    expect(source).toContain('booking.postEventEmailSent');
    expect(timelineBlock).toContain('{portalPostEventTimelineStatus}');
    expect(timelineBlock).not.toContain('booking.postEventReport ? t.postEventDone : t.postEventProgress');
  });
});
