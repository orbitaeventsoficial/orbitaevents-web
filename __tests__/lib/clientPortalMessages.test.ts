import { describe, expect, it } from 'vitest';
import {
  CLIENT_PORTAL_MESSAGES,
  getClientPortalBookingStatusLabel,
  getClientPortalContractStatusLabel,
  getClientPortalExtraDisplayName,
  getClientPortalGalleryPhotoCountLabel,
  getClientPortalGalleryPhotoLabel,
  getClientPortalPackDisplayName,
  getClientPortalServiceQuantityLabel,
  getClientPortalTravelHeadcountLabel,
} from '@/lib/clientPortalMessages';

describe('CLIENT_PORTAL_MESSAGES', () => {
  it('manté les mateixes claus a tots els locales del portal', () => {
    const caKeys = Object.keys(CLIENT_PORTAL_MESSAGES.ca).sort();

    expect(Object.keys(CLIENT_PORTAL_MESSAGES.es).sort()).toEqual(caKeys);
    expect(Object.keys(CLIENT_PORTAL_MESSAGES.en).sort()).toEqual(caKeys);
  });

  it('no barreja català al CTA de pressupost del portal castellà', () => {
    expect(CLIENT_PORTAL_MESSAGES.es.openQuote).toBe('Abrir presupuesto');
    expect(CLIENT_PORTAL_MESSAGES.es.openQuote).not.toMatch(/Obrir|pressupost/i);
  });

  it('localitza el label curt del pack al portal anglès', () => {
    expect(CLIENT_PORTAL_MESSAGES.en.packLabel).toBe('Package');
    expect(CLIENT_PORTAL_MESSAGES.en.packLabel).not.toBe('Pack');
  });

  it('localitza els documents d’albarà del portal', () => {
    expect(CLIENT_PORTAL_MESSAGES.ca.deliveryNoteLabel).toBe('Albarà');
    expect(CLIENT_PORTAL_MESSAGES.es.deliveryNoteDownloadPdf).toBe('Descargar PDF del albarán');
    expect(CLIENT_PORTAL_MESSAGES.en.deliveryNoteStatusSigned).toBe('Signed');
  });

  it('nomena l’estat post-event del portal com a email canònic, no feedback legacy', () => {
    expect(CLIENT_PORTAL_MESSAGES.ca.postEventEmailSent).toBe('Email post-event enviat');
    expect(CLIENT_PORTAL_MESSAGES.es.postEventEmailPending).toBe('Email post-event pendiente');
    expect(CLIENT_PORTAL_MESSAGES.en.postEventEmailSent).toBe('Post-event email sent');
    expect(CLIENT_PORTAL_MESSAGES.ca).not.toHaveProperty('feedbackSent');
    expect(CLIENT_PORTAL_MESSAGES.ca).not.toHaveProperty('pendingClose');
  });

  it('localitza el comptador de fotos de la galeria amb singular i plural', () => {
    expect(getClientPortalGalleryPhotoCountLabel('ca', 1)).toBe('1 foto');
    expect(getClientPortalGalleryPhotoCountLabel('es', 2)).toBe('2 fotos');
    expect(getClientPortalGalleryPhotoCountLabel('en', 1)).toBe('1 photo');
    expect(getClientPortalGalleryPhotoCountLabel('en', 3)).toBe('3 photos');
  });

  it('dona un fallback de foto concret sense trepitjar captions reals', () => {
    expect(getClientPortalGalleryPhotoLabel(CLIENT_PORTAL_MESSAGES.en.galleryPhotoLabel, null, 0)).toBe('Photo 1');
    expect(getClientPortalGalleryPhotoLabel(CLIENT_PORTAL_MESSAGES.ca.galleryPhotoLabel, '  Entrada  ', 1)).toBe('Entrada');
  });

  it('localitza el detall de persones del desplaçament', () => {
    expect(getClientPortalTravelHeadcountLabel('ca', 1)).toBe('1 persona · 1a hora inclosa');
    expect(getClientPortalTravelHeadcountLabel('es', 2)).toBe('2 personas · 1.ª hora incluida');
    expect(getClientPortalTravelHeadcountLabel('en', 1)).toBe('1 person · 1st hour included');
    expect(getClientPortalTravelHeadcountLabel('en', 3)).toBe('3 people · 1st hour included');
  });

  it('localitza la quantitat accessible dels serveis contractats', () => {
    expect(getClientPortalServiceQuantityLabel('ca', 2)).toBe('quantitat 2');
    expect(getClientPortalServiceQuantityLabel('es', 3)).toBe('cantidad 3');
    expect(getClientPortalServiceQuantityLabel('en', 4)).toBe('quantity 4');
  });

  it('no exposa estats interns de contracte no etiquetats al portal', () => {
    expect(getClientPortalContractStatusLabel('es', 'SENT')).toBe('Enviado');
    expect(getClientPortalContractStatusLabel('es', 'ARCHIVED_INTERNAL')).toBe('Estado pendiente de confirmar');
    expect(getClientPortalContractStatusLabel('es', 'ARCHIVED_INTERNAL')).not.toBe('ARCHIVED_INTERNAL');
  });

  it('no exposa estats interns de reserva no etiquetats al portal', () => {
    expect(getClientPortalBookingStatusLabel('ca', 'CONFIRMED')).toBe('Confirmada');
    expect(getClientPortalBookingStatusLabel('ca', 'SYNC_PENDING_INTERNAL')).toBe('Estat pendent de confirmar');
    expect(getClientPortalBookingStatusLabel('ca', 'SYNC_PENDING_INTERNAL')).not.toBe('SYNC_PENDING_INTERNAL');
  });

  it('no exposa slugs interns quan falta traducció de pack o extra', () => {
    expect(getClientPortalPackDisplayName('es', '')).toBe('Pack contratado');
    expect(getClientPortalPackDisplayName('es', null)).not.toBe('disco-premium');
    expect(getClientPortalExtraDisplayName('en', '   ')).toBe('Booked extra');
    expect(getClientPortalExtraDisplayName('en', null)).not.toBe('confetti-xl');
  });
});
