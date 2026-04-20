import type { CustomerFollowUpSummaryDTO, CustomerInsightsDTO } from './dto';

export type CustomerCommercialPriority = {
  title: string;
  detail: string;
  footnote?: string;
} | null;

export function buildCustomerCommercialPriority(input: {
  insights: CustomerInsightsDTO;
  followUpSummary?: CustomerFollowUpSummaryDTO;
}): CustomerCommercialPriority {
  const { insights, followUpSummary } = input;

  if (insights.commercialRisk.level === 'HIGH') {
    return {
      title: 'Prioritat comercial alta',
      detail: insights.commercialRisk.context || insights.commercialRisk.label,
      footnote: followUpSummary?.topItem
        ? `${followUpSummary.topItem.name} · ${followUpSummary.topItem.daysSinceOutbound}d sense resposta`
        : undefined,
    };
  }

  if (insights.commercialRisk.level === 'MEDIUM') {
    return {
      title: 'Prioritat comercial activa',
      detail: insights.commercialRisk.context || insights.commercialRisk.label,
      footnote: insights.nextAction.context,
    };
  }

  if (insights.nextAction.type === 'SEND_PROPOSAL' || insights.nextAction.type === 'FOLLOW_UP') {
    return {
      title: 'Pròxim pas comercial',
      detail: insights.nextAction.label,
      footnote: insights.nextAction.context,
    };
  }

  return null;
}
