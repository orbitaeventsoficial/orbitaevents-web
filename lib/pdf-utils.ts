/**
 * PDF Generation Utilities for Òrbita Events
 * Barrel re-export — manté compatibilitat backward amb tots els consumidors existents.
 *
 * Implementació real als serveis i utils específics:
 *   lib/services/catalogPdfService.ts  → generateServiceBrochure
 *   lib/services/quotePdfService.ts    → QuoteData + generateQuotePDF
 *   lib/services/contractPdfService.ts → ContractPdfData + generateContractPDF
 *   lib/utils/pdfDownload.ts           → downloadImage + downloadImages
 */

export { generateServiceBrochure } from '@/lib/services/catalogPdfService';
export { generateQuotePDF, type QuoteData } from '@/lib/services/quotePdfService';
export { generateContractPDF, type ContractPdfData } from '@/lib/services/contractPdfService';
export { downloadImage, downloadImages } from '@/lib/utils/pdfDownload';
