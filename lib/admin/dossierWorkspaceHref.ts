export type DossierWorkspaceAction = 'preview';

export function buildDossierListHref(leadId?: string | null, action?: DossierWorkspaceAction | null): string {
  const params = new URLSearchParams();
  if (leadId) params.set('leadId', leadId);
  if (action) params.set('action', action);
  const query = params.toString();
  return query ? `/admin/dossiers?${query}` : '/admin/dossiers';
}

export function buildDossierPreviewHref(leadId: string): string {
  return `/api/admin/leads/${encodeURIComponent(leadId)}/dossier-preview`;
}

export function buildDossierGeneratorPreviewHref(leadId: string): string {
  return buildDossierListHref(leadId, 'preview');
}

export function buildDossierStoredPreviewHref(dossierId: string): string {
  return `/api/admin/dossiers/${dossierId}/preview`;
}

export function buildDossierCompositePdfHref(dossierId: string): string {
  return `/api/admin/dossiers/${dossierId}/composite`;
}
