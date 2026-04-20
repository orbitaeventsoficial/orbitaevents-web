import type { CustomerCommSummaryDTO, CustomerFollowUpSummaryDTO, CustomerInsightsDTO } from './dto';
import {
  buildCustomerBookingListHref,
  buildCustomerComposeHref,
  buildCustomerProposalHref,
  buildCustomerTaskListHref,
} from '@/lib/admin/customerWorkspaceHref';

type NextActionLinkInput = {
  customerId: string;
  customerName: string;
  customerPhone?: string | null;
  nextAction: CustomerInsightsDTO['nextAction'];
  commSummary: CustomerCommSummaryDTO;
};

export type NextActionLink = {
  href: string;
  label: string;
  external?: boolean;
} | null;

function buildWhatsappMessage(customerName: string): string {
  return `Hola ${customerName}, et responc per seguir amb els detalls pendents. Quan et va bé que ho tanquem?`;
}

export function buildCustomerNextActionLink(input: NextActionLinkInput): NextActionLink {
  const { customerId, customerName, customerPhone, nextAction, commSummary } = input;

  if (nextAction.type === 'SEND_PROPOSAL') {
    return { href: buildCustomerProposalHref(customerId), label: 'Crear pressupost' };
  }

  if (nextAction.type === 'COLLECT_PAYMENT') {
    return { href: buildCustomerBookingListHref(customerId), label: 'Revisar cobraments' };
  }

  if (nextAction.type === 'COMPLETE_TASK') {
    return { href: buildCustomerTaskListHref(customerId), label: 'Veure tasques' };
  }

  if (nextAction.type === 'FOLLOW_UP') {
    if (commSummary.lastContactChannel === 'WHATSAPP' && customerPhone) {
      const phone = customerPhone.replace(/[^\d]/g, '');
      if (phone) {
        return {
          href: `https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsappMessage(customerName))}`,
          label: 'Respondre per WhatsApp',
          external: true,
        };
      }
    }

    return {
      href: buildCustomerComposeHref(customerId, 'recordatori'),
      label: nextAction.label === 'Respondre al client' ? 'Respondre per email' : 'Enviar seguiment',
    };
  }

  return null;
}

type CommercialRiskLinkInput = {
  customerId: string;
  customerName: string;
  customerPhone?: string | null;
  commercialRisk: CustomerInsightsDTO['commercialRisk'];
  followUpSummary?: CustomerFollowUpSummaryDTO;
};

export function buildCustomerCommercialRiskLink(input: CommercialRiskLinkInput): NextActionLink {
  const { customerId, customerName, customerPhone, commercialRisk, followUpSummary } = input;
  if (commercialRisk.level === 'NONE') return null;

  const topItem = followUpSummary?.topItem;
  if (topItem?.phone) {
    const phone = topItem.phone.replace(/[^\d]/g, '');
    if (phone && topItem.urgency === 'URGENT') {
      return {
        href: `https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsappMessage(customerName))}`,
        label: 'Desencallar per WhatsApp',
        external: true,
      };
    }
  }

  return {
    href: buildCustomerComposeHref(customerId, 'seguiment'),
    label: commercialRisk.level === 'HIGH' ? 'Desencallar seguiment' : 'Reactivar conversa',
  };
}
