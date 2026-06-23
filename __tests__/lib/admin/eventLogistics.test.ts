import { describe, it, expect } from 'vitest';
import {
  buildTelHref, buildWazeUrl, buildMapsUrl, estimateTravelMinutes,
  computeDepartureTime, buildEventLogistics, SETUP_MINUTES,
} from '@/lib/admin/eventLogistics';

describe('eventLogistics', () => {
  describe('buildTelHref', () => {
    it('neteja espais i guions', () => {
      expect(buildTelHref('+34 699 12 10 23')).toBe('tel:+34699121023');
      expect(buildTelHref('699-121-023')).toBe('tel:699121023');
    });
    it('null si buit o massa curt', () => {
      expect(buildTelHref(null)).toBeNull();
      expect(buildTelHref('12')).toBeNull();
    });
  });

  describe('buildWazeUrl / buildMapsUrl', () => {
    it('codifica l\'adreça', () => {
      expect(buildWazeUrl('Plaça Major 1, Granollers')).toBe(
        'https://waze.com/ul?q=Pla%C3%A7a%20Major%201%2C%20Granollers&navigate=yes',
      );
      expect(buildMapsUrl('Carrer X 2')).toContain('google.com/maps/search/');
    });
    it('null si no hi ha adreça', () => {
      expect(buildWazeUrl(null)).toBeNull();
      expect(buildMapsUrl('  ')).toBeNull();
    });
  });

  describe('estimateTravelMinutes', () => {
    it('km / velocitat → minuts', () => {
      expect(estimateTravelMinutes(65)).toBe(60);   // 65km a 65km/h = 1h
      expect(estimateTravelMinutes(32.5)).toBe(30);
    });
    it('0 si no hi ha distància', () => {
      expect(estimateTravelMinutes(0)).toBe(0);
      expect(estimateTravelMinutes(null)).toBe(0);
    });
  });

  describe('computeDepartureTime (hora bolo − viatge − muntatge)', () => {
    it('resta viatge i muntatge (+1h per defecte)', () => {
      // bolo 20:00, 30 min viatge, 60 min muntatge → sortir 18:30
      expect(computeDepartureTime({ eventStartTime: '20:00', travelMinutes: 30 })).toBe('18:30');
    });
    it('muntatge per defecte = SETUP_MINUTES (60)', () => {
      expect(SETUP_MINUTES).toBe(60);
      // bolo 19:00, 0 viatge → sortir 18:00
      expect(computeDepartureTime({ eventStartTime: '19:00', travelMinutes: 0 })).toBe('18:00');
    });
    it('embolcalla si creua mitjanit cap enrere', () => {
      // bolo 00:30, 60 viatge, 60 muntatge → 23:30 del dia anterior
      expect(computeDepartureTime({ eventStartTime: '00:30', travelMinutes: 60 })).toBe('22:30');
    });
    it('null si no hi ha hora vàlida', () => {
      expect(computeDepartureTime({ eventStartTime: null, travelMinutes: 0 })).toBeNull();
      expect(computeDepartureTime({ eventStartTime: 'tarda', travelMinutes: 0 })).toBeNull();
    });
  });

  describe('buildEventLogistics (resum complet)', () => {
    it('combina tot: tel, waze, maps, sortida', () => {
      const r = buildEventLogistics({
        phone: '699121023', address: 'Sala X, Arenys', distanceKm: 65, eventStartTime: '20:00',
      });
      expect(r.telHref).toBe('tel:699121023');
      expect(r.wazeUrl).toContain('waze.com');
      expect(r.travelMinutes).toBe(60);
      expect(r.setupMinutes).toBe(60);
      expect(r.departureTime).toBe('18:00'); // 20:00 − 60 viatge − 60 muntatge
    });
  });
});
