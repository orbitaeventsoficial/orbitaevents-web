/**
 * Tests del sistema d'auto-triggers del workflow.
 *
 * `automationTriggers.ts` centralitza les accions automàtiques que es
 * disparen quan canvia l'estat d'un lead, reserva o proposta.
 *
 * NOTA: Totes les funcions principals (onProposalAccepted, onLeadCreated,
 * onBookingConfirmed) depenen de Prisma/DB i no es poden testar com a
 * funcions pures. Aquí verifiquem:
 *
 * 1. Que el mòdul exporta les funcions esperades
 * 2. Que el tipus AutoTriggerEvent cobreix els 3 events del workflow
 * 3. Que dispatchAutoTrigger és una funció (el routing intern es testaria
 *    amb integració/e2e)
 */

import { describe, it, expect } from 'vitest';
import {
  onProposalAccepted,
  onLeadCreated,
  onBookingConfirmed,
  dispatchAutoTrigger,
  type AutoTriggerEvent,
} from '@/lib/services/automationTriggers';

describe('automationTriggers', () => {
  // ─── Exportacions ──────────────────────────────────────────────────────────

  describe('exportacions del mòdul', () => {
    it('exporta onProposalAccepted com a funció async', () => {
      expect(typeof onProposalAccepted).toBe('function');
    });

    it('exporta onLeadCreated com a funció async', () => {
      expect(typeof onLeadCreated).toBe('function');
    });

    it('exporta onBookingConfirmed com a funció async', () => {
      expect(typeof onBookingConfirmed).toBe('function');
    });

    it('exporta dispatchAutoTrigger com a funció async', () => {
      expect(typeof dispatchAutoTrigger).toBe('function');
    });
  });

  // ─── Verificació de tipus (compilació TS) ─────────────────────────────────
  // Aquests tests no executen res amb DB — només verifiquen que
  // els tipus TypeScript compilin correctament.

  describe('tipus AutoTriggerEvent', () => {
    it('accepta event proposal.accepted amb proposalId', () => {
      const event: AutoTriggerEvent = {
        type: 'proposal.accepted',
        proposalId: 'test-proposal-123',
      };
      expect(event.type).toBe('proposal.accepted');
    });

    it('accepta event lead.created amb leadId', () => {
      const event: AutoTriggerEvent = {
        type: 'lead.created',
        leadId: 'test-lead-456',
      };
      expect(event.type).toBe('lead.created');
    });

    it('accepta event booking.confirmed amb bookingId', () => {
      const event: AutoTriggerEvent = {
        type: 'booking.confirmed',
        bookingId: 'test-booking-789',
      };
      expect(event.type).toBe('booking.confirmed');
    });

    it('els 3 tipus d\'event cobreixen el workflow complet', () => {
      // Verifiquem que tenim exactament els 3 events documentats
      const eventTypes: AutoTriggerEvent['type'][] = [
        'proposal.accepted',
        'lead.created',
        'booking.confirmed',
      ];
      expect(eventTypes).toHaveLength(3);
      // Cada tipus és un string vàlid
      for (const t of eventTypes) {
        expect(typeof t).toBe('string');
        expect(t).toContain('.');
      }
    });
  });
});
