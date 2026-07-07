import { describe, expect, it } from 'vitest';
import {
  getClientPortalHiddenNavItems,
  getClientPortalVisibility,
} from '@/lib/clientPortalVisibility';

describe('getClientPortalVisibility', () => {
  it('mostra totes les seccions per defecte', () => {
    expect(getClientPortalVisibility(null)).toEqual({
      payments: true,
      timeline: true,
      documents: true,
      postEvent: true,
      questionnaire: true,
    });
  });

  it('només amaga una secció quan el flag és false explícit', () => {
    expect(getClientPortalVisibility({
      showPayments: false,
      showTimeline: false,
      showDocuments: false,
      showPostEvent: false,
      showQuestionnaire: false,
    })).toEqual({
      payments: false,
      timeline: false,
      documents: false,
      postEvent: false,
      questionnaire: false,
    });
  });

  it('ignora flags legacy que no siguin booleans', () => {
    expect(getClientPortalVisibility({
      showPayments: 'false',
      showTimeline: 0,
    })).toEqual({
      payments: true,
      timeline: true,
      documents: true,
      postEvent: true,
      questionnaire: true,
    });
  });

  it('deriva els elements amagats de la nav inferior des del mateix contracte', () => {
    const visibility = getClientPortalVisibility({
      showPayments: false,
      showTimeline: false,
      showDocuments: false,
    });

    expect(getClientPortalHiddenNavItems(visibility)).toEqual({
      payments: true,
      timeline: true,
      contract: true,
    });
  });
});
