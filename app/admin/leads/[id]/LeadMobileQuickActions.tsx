'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import MobileQuickActions from '@/app/admin/components/MobileQuickActions';
import { patchLeadStatus } from '../leadStatusClient';

type LeadMobileQuickActionsProps = {
  leadId: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string | null;
  currentStatus: 'NEW' | 'CONTACTED' | 'QUOTE_SENT' | 'NEGOTIATING' | 'WON' | 'LOST';
};

export default function LeadMobileQuickActions({
  leadId,
  leadName,
  leadEmail,
  leadPhone,
  currentStatus,
}: LeadMobileQuickActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const canMarkContacted = currentStatus === 'NEW';

  return (
    <MobileQuickActions
      phone={leadPhone}
      email={leadEmail}
      whatsappMessage={`Hola ${leadName}! Sóc de Òrbita Events, hem rebut la teva sol·licitud i volem ajudar-te a organitzar el teu event.`}
      primaryAction={
        canMarkContacted
          ? {
              label: 'Marcar contactat',
              busyLabel: 'Marcant...',
              busy,
              onClick: async () => {
                if (busy) return;
                setBusy(true);
                try {
                  await patchLeadStatus({ leadId, status: 'CONTACTED' });
                  startTransition(() => router.refresh());
                } finally {
                  setBusy(false);
                }
              },
            }
          : null
      }
    />
  );
}
