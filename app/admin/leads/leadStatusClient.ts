import { fetchWithCsrf } from '@/lib/csrf';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUOTE_SENT' | 'NEGOTIATING' | 'WON' | 'LOST';

export type PatchLeadStatusInput = {
  leadId: string;
  status: LeadStatus;
  lostReason?: string;
  note?: string;
};

export async function patchLeadStatus(input: PatchLeadStatusInput) {
  const res = await fetchWithCsrf(`/api/admin/leads/${input.leadId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: input.status,
      ...(input.lostReason ? { lostReason: input.lostReason } : {}),
      ...(typeof input.note === 'string' ? { note: input.note } : {}),
    }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || "Error actualitzant l'estat");
  }

  return payload;
}
