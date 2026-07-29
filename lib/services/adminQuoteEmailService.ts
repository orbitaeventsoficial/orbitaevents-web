type AdminQuoteEmailPayload = Record<string, unknown> | undefined;

export async function sendAdminQuoteEmail(_body: AdminQuoteEmailPayload) {
  return {
    ok: false as const,
    status: 410,
    body: {
      ok: false,
      error: 'Flux antic de pressupost desactivat. Els pressupostos s\'envien només des de Proposal.',
      canonicalRoute: '/api/admin/proposals/:id/send',
    },
  };
}
