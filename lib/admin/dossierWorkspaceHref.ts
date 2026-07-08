export function buildDossierListHref(leadId?: string | null): string {
  if (!leadId) return '/admin/dossiers';
  const params = new URLSearchParams({ leadId });
  return `/admin/dossiers?${params.toString()}`;
}

export function buildDossierCompositePdfHref(dossierId: string): string {
  return `/api/admin/dossiers/${dossierId}/composite`;
}
