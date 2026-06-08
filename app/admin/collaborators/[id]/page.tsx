import { notFound } from 'next/navigation';
import { AdminPage } from '../../components/AdminPage';
import { fetchPartnerHub } from '@/lib/services/partnerHubService';
import { COLLABORATOR_ROLE_OPTIONS } from '@/lib/constants/admin';
import PartnerHubClient from './PartnerHubClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const hub = await fetchPartnerHub(params.id);
  return { title: hub ? `${hub.partner.name} | Partners` : 'Partner no trobat' };
}

export default async function PartnerDetailPage({ params }: Props) {
  const hub = await fetchPartnerHub(params.id);
  if (!hub) notFound();

  const roleLabels = hub.partner.roles
    .map((role) => COLLABORATOR_ROLE_OPTIONS.find((option) => option.value === role)?.label || role)
    .join(' · ');

  const data = {
    partner: {
      id: hub.partner.id,
      name: hub.partner.name,
      company: hub.partner.company,
      email: hub.partner.email,
      phone: hub.partner.phone,
      specialty: hub.partner.specialty,
      roles: hub.partner.roles,
      commissionPct: hub.partner.commissionPct,
      pricingModel: hub.partner.pricingModel,
      costPerHour: hub.partner.costPerHour,
      notes: hub.partner.notes,
      isActive: hub.partner.isActive,
    },
    economics: hub.economics,
    sourcedLeads: hub.sourcedLeads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      eventType: lead.eventType,
      status: lead.status,
      budget: lead.budget,
      eventDate: lead.eventDate ? lead.eventDate.toISOString() : null,
    })),
    sourcedBookings: hub.sourcedBookings.map((booking) => ({
      id: booking.id,
      reference: booking.reference,
      clientName: booking.clientName,
      status: booking.status,
      total: booking.total,
      eventDate: booking.eventDate ? booking.eventDate.toISOString() : null,
    })),
    contractedBookings: hub.contractedBookings.map((item) => ({
      id: item.id,
      commissionAmount: item.commissionAmount,
      collaboratorPrice: item.collaboratorPrice,
      isPaid: item.isPaid,
      reference: item.booking.reference,
      clientName: item.booking.clientName,
      status: item.booking.status,
      total: item.booking.total,
      eventDate: item.booking.eventDate ? item.booking.eventDate.toISOString() : null,
    })),
    products: hub.products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      costPrice: product.costPrice,
      sellPrice: product.sellPrice,
      isActive: product.isActive,
    })),
  };

  return (
    <AdminPage
      title={hub.partner.name}
      subtitle={roleLabels || 'Partner sense rols assignats'}
      back={{ href: '/admin/collaborators', label: 'Partners' }}
    >
      <PartnerHubClient data={data} />
    </AdminPage>
  );
}
