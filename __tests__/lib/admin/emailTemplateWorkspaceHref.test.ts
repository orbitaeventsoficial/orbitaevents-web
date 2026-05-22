import { describe, expect, it } from 'vitest';
import { buildEmailTemplateHref } from '@/lib/admin/emailTemplateWorkspaceHref';

describe('buildEmailTemplateHref', () => {
  it('construeix la ruta base de plantilla email', () => {
    expect(buildEmailTemplateHref('post_event')).toBe('/admin/email-templates/post_event');
  });

  it('afegeix locale quan es passa idioma', () => {
    expect(buildEmailTemplateHref('post_event', 'ca')).toBe('/admin/email-templates/post_event?locale=ca');
  });
});
