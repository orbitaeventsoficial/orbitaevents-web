import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('/admin/post-event test artifact visibility', () => {
  const source = readFileSync(
    join(process.cwd(), 'app/admin/post-event/page.tsx'),
    'utf8'
  );

  it('uses the shared booking test artifact detector', () => {
    expect(source).toContain('isAdminTestBookingArtifact');
    expect(source).toContain('type AdminTestBookingArtifactInput');
    expect(source).toContain('function isTestPostEventReportArtifact');
    expect(source).toContain('function isTestClientSurveyArtifact');
  });

  it('filters post-event metrics in normal mode', () => {
    expect(source).toContain('getPostEventData(showTestPostEvent: boolean)');
    expect(source).toContain('buildPendingPostEventEmailBookingWhere(now)');
    expect(source).toContain('pendingEmailBookingsRaw.filter');
    expect(source).toContain('pendingReportsRaw.filter');
    expect(source).toContain('pendingSurveyBookingsRaw.filter');
    expect(source).toContain('completedReportsRaw.filter');
    expect(source).toContain('completedSurveysRaw.filter');
  });

  it('shows pending post-event emails on the hub with a safe CTA', () => {
    expect(source).toContain('Emails pendents');
    expect(source).toContain("L'enviament real es fa des d'Emails amb confirmació.");
    expect(source).toContain('Gestionar emails');
    expect(source).toContain('href="/admin/emails"');
  });

  it('uses follow-up wording instead of visible feedback legacy labels', () => {
    expect(source).toContain('Agraïment al Client');
    expect(source).toContain('Veure seguiment');
    expect(source).toContain('Gestiona informes, enquestes i seguiment dels esdeveniments');
    expect(source).not.toContain('Feedback al Client');
    expect(source).not.toContain('Veure feedback');
  });

  it('keeps an explicit review mode for post-event test evidence', () => {
    expect(source).toContain('showTestPostEvent');
    expect(source).toContain('elements de prova post-event');
    expect(source).toContain('Mostrar proves');
    expect(source).toContain('Ocultar proves');
  });
});
