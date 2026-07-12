import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const roadmapPath = path.resolve('docs/audit/MANOLO-ZENIT-RESET-TOTAL-1551.md');

describe('Manolo post-event roadmap', () => {
  it('manté la fila executiva sincronitzada amb la ruta de seguiment', () => {
    const roadmap = readFileSync(roadmapPath, 'utf8');
    const row = roadmap
      .split(/\r?\n/)
      .find((line) => line.startsWith('| Post-event i recurrencia - sync ruta seguiment |'));

    expect(row).toBeDefined();
    expect(row).toContain('#2013');
    expect(row).toContain('#2014');
    expect(row).toContain('#2015');
    expect(row).toContain('#2016');
    expect(row).toContain('buildPendingPostEventFollowUpBookingWhere');
    expect(row).toContain('/admin/post-event/seguiment');
    expect(row).toContain('/admin/post-event/feedback');
    expect(row).not.toContain('buildPendingPostEventFeedbackBookingWhere');
  });
});
