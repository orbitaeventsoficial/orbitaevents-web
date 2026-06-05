export const PDF_HEADER_LAYOUT = {
  canonical: {
    height: 44,
    logoWidth: 52,
    logoHeight: 14,
    logoTop: 9,
    brandMetaY: 34,
    contentX: 82,
    contentRight: 192,
    eyebrowY: 11,
    titleY: 23,
    refY: 34,
    titleMaxSize: 16,
    titleMinSize: 11,
    contentGap: 6,
    contentStartY: 50,
  },
} as const;

export const PDF_DOCUMENT_CATALOG = [
  {
    id: 'pressupost',
    name: 'Pressupost',
    generator: 'generateQuotePDF',
    previewUrl: '/api/admin/studio/preview/pressupost',
    previewTitle: 'Pressupost PDF real',
    theme: 'paper clar + or',
    sections: ['Client i contacte', 'Esdeveniment', 'Pack i característiques', 'Extres', 'Resum econòmic'],
    optionalSections: ['Condicions', 'Per què escollir-nos'],
    pagination: 'Una pàgina A4 sempre que sigui llegible; si sobra espai, el layout redistribueix respiració i blocs útils sense inventar dades.',
  },
  {
    id: 'contracte',
    name: 'Contracte',
    generator: 'generateContractPDF',
    previewUrl: '/api/admin/studio/preview/contracte',
    previewTitle: 'Contracte PDF real',
    theme: 'paper clar + or',
    sections: ['Parts', 'Servei contractat', 'Resum econòmic', 'Pagaments', 'Cancel·lació', 'Clàusules legals', 'Signatures'],
    optionalSections: ['Clàusules addicionals', 'Signatura digital del client'],
    pagination: 'Manté totes les clàusules legals i signatures.',
  },
  {
    id: 'cataleg',
    name: 'Catàleg de serveis',
    generator: 'generateServiceBrochure',
    previewUrl: '/api/admin/studio/preview/cataleg?service=bodas',
    previewTitle: 'Catàleg PDF real',
    theme: 'paper clar + or',
    sections: ['Servei', 'Packs', 'Característiques', 'Extres compatibles', 'Contacte'],
    optionalSections: [],
    pagination: 'Una pàgina A4 per servei sempre que sigui llegible; si sobra espai, amplia la composició sense farciment fictici.',
  },
  {
    id: 'informe',
    name: 'Informe executiu',
    generator: 'exportExecutiveReportPdf',
    previewUrl: '/api/admin/studio/preview/informe',
    previewTitle: 'Informe executiu PDF real',
    theme: 'paper clar + or',
    sections: ['Indicadors principals', 'Embut comercial', 'Conversió per origen', 'Recurrència', 'Marge', 'Tendència mensual'],
    optionalSections: ['Leads en risc'],
    pagination: 'Una pàgina A4 executiva sempre que sigui llegible; les taules només continuen si el volum real ho exigeix.',
  },
  {
    id: 'factura',
    name: 'Factura',
    generator: 'generateInvoicePDF',
    previewUrl: '/api/admin/studio/preview/factura',
    previewTitle: 'Factura PDF real',
    theme: 'capçalera fosca + paper càlid + or',
    sections: ['Emissor i receptor', 'Dades de l\'event', 'Línies de facturació', 'Totals', 'Estat de pagaments'],
    optionalSections: ['Notes legals'],
    pagination: 'Una pàgina A4 sempre que sigui llegible.',
  },
  {
    id: 'dossier',
    name: 'Dossier comercial',
    generator: 'buildDossierHtml',
    previewUrl: null,
    previewTitle: 'Dossier comercial',
    theme: 'portada fosca + cos clar + or',
    sections: ['Portada amb logo i nom', 'Propostes', 'Què inclou', 'Preus', 'Nota personalitzada', 'Contacte'],
    optionalSections: ['Empresa', 'Descripció de l’esdeveniment', 'Què no inclou'],
    pagination: 'La portada ocupa la primera pàgina; cada producte ofertat comença en una pàgina nova amb el lockup horitzontal al header.',
  },
] as const;

export type PdfDocumentId = (typeof PDF_DOCUMENT_CATALOG)[number]['id'];

export const PDF_PREVIEW_FILENAMES: Record<Exclude<PdfDocumentId, 'dossier'>, string> = {
  pressupost: 'preview-pressupost.pdf',
  contracte: 'preview-contracte.pdf',
  cataleg: 'preview-cataleg.pdf',
  informe: 'preview-informe.pdf',
  factura: 'preview-factura.pdf',
} as const;

export const PDF_PREVIEW_RESPONSE_HEADERS = {
  contentType: 'application/pdf',
  frameOptions: 'SAMEORIGIN',
  contentSecurityPolicy: "frame-ancestors 'self'",
  dispositionMode: 'inline',
} as const;

export const PDF_PREVIEW_PLACEHOLDER = 'XXXXXX';
