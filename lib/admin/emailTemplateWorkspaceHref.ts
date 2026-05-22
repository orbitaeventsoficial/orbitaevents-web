export function buildEmailTemplateHref(slug: string, locale?: string | null): string {
  const base = `/admin/email-templates/${slug}`;
  return locale ? `${base}?locale=${locale}` : base;
}
