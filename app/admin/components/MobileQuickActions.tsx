'use client';

type MobileQuickActionsProps = {
  phone?: string | null;
  email?: string | null;
  emailHref?: string | null;
  whatsappMessage?: string | null;
  primaryAction?: {
    label: string;
    onClick: () => void | Promise<void>;
    busyLabel?: string;
    busy?: boolean;
  } | null;
};

function buildWhatsAppHref(phone: string, message?: string | null): string {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  if (!message) return `https://wa.me/${cleanPhone}`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export default function MobileQuickActions({
  phone,
  email,
  emailHref,
  whatsappMessage,
  primaryAction,
}: MobileQuickActionsProps) {
  const hasActions = Boolean(phone || email || primaryAction);
  if (!hasActions) return null;

  return (
    <section className="md:hidden rounded-2xl border border-white/10 p-3 admin-card-glass">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] opacity-60">
        Accions ràpides
      </p>
      <div className="grid grid-cols-2 gap-2">
        {phone ? (
          <a
            href={`tel:${phone}`}
            className="ap-btn ap-btn--secondary flex items-center justify-center gap-2 px-3 py-2 text-xs"
          >
            <span>📞</span>
            <span>Trucar</span>
          </a>
        ) : null}
        {phone ? (
          <a
            href={buildWhatsAppHref(phone, whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="ap-btn ap-btn--primary flex items-center justify-center gap-2 px-3 py-2 text-xs"
          >
            <span>💬</span>
            <span>WhatsApp</span>
          </a>
        ) : null}
        {email ? (
          <a
            href={emailHref || '/admin/inbox/compose'}
            className="ap-btn ap-btn--secondary flex items-center justify-center gap-2 px-3 py-2 text-xs"
          >
            <span>✉️</span>
            <span>Correu</span>
          </a>
        ) : null}
        {primaryAction ? (
          <button
            type="button"
            onClick={() => void primaryAction.onClick()}
            disabled={primaryAction.busy}
            className="ap-btn ap-btn--secondary flex items-center justify-center gap-2 px-3 py-2 text-xs disabled:opacity-50"
          >
            <span>✅</span>
            <span>{primaryAction.busy ? (primaryAction.busyLabel || primaryAction.label) : primaryAction.label}</span>
          </button>
        ) : null}
      </div>
    </section>
  );
}
