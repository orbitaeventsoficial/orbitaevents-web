type AdminLogLike = {
  action: string;
  createdAt: Date;
  details?: unknown;
};

interface FlowStatus {
  state: 'FALTA_ENVIAR' | 'ENVIADO' | 'RESPONDIDO';
  sentAt: Date | null;
  respondedAt: Date | null;
  lastChannel: string | null;
}

function parseDetails(details: unknown): Record<string, unknown> {
  if (!details || typeof details !== 'object') return {};
  return details as Record<string, unknown>;
}

export function deriveFlowStatus(logs: AdminLogLike[], flow: string): FlowStatus {
  const sentLogs = logs
    .filter((log) => {
      const details = parseDetails(log.details);
      return log.action === 'COMM_SENT' && details.flow === flow;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const respondedLogs = logs
    .filter((log) => {
      const details = parseDetails(log.details);
      return log.action === 'COMM_RESPONDED' && details.flow === flow;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const sentAt = sentLogs[0]?.createdAt || null;
  const respondedAt = respondedLogs[0]?.createdAt || null;
  const lastChannel = sentLogs[0]
    ? (parseDetails(sentLogs[0].details).channel as string | undefined) || null
    : null;

  if (respondedAt) {
    return { state: 'RESPONDIDO', sentAt, respondedAt, lastChannel };
  }
  if (sentAt) {
    return { state: 'ENVIADO', sentAt, respondedAt: null, lastChannel };
  }
  return { state: 'FALTA_ENVIAR', sentAt: null, respondedAt: null, lastChannel: null };
}
