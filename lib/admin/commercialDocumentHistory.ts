export function getDossierHistoryKindLabel(mode: string | null | undefined): string {
  return mode === 'quote' ? 'Dossier comercial històric' : 'Dossier';
}

export function getLeadDocumentHistoryMeta(type: string, fileUrl: string | null | undefined) {
  if (type === 'QUOTE') {
    return {
      kindLabel: 'Traça legacy retirada',
      statusLabel: 'RETIRAT',
      href: null,
      targetBlank: false,
    };
  }

  if (type === 'CONTRACT') {
    return {
      kindLabel: 'Contracte antic',
      statusLabel: type,
      href: fileUrl || null,
      targetBlank: Boolean(fileUrl),
    };
  }

  return {
    kindLabel: 'Document',
    statusLabel: type,
    href: fileUrl || null,
    targetBlank: Boolean(fileUrl),
  };
}
