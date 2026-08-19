/**
 * Normalització d'errors — font única.
 *
 * L'idioma `err instanceof Error ? err.message : '<text>'` estava repetit 104
 * vegades amb 10 textos de reserva diferents (#1165): el mateix cas — algú
 * llança una cosa que no és `Error` — podia acabar mostrant «Error desconegut»,
 * «Error», «Error inesperat» o fins i tot «Unknown error» en un admin que és
 * íntegrament en català.
 *
 * Aquí viu el procés; el text de reserva es passa quan el context el fa útil
 * («Error en desar», «Error carregant»…). Sense argument, el defecte és el
 * text canònic en català.
 */

export const UNKNOWN_ERROR_MESSAGE = 'Error desconegut';

/**
 * Retorna un missatge llegible a partir de qualsevol valor llançat.
 *
 * Cobreix els casos reals que es donen al repo: `Error` (i subclasses),
 * strings llançats directament, objectes tipus `{ message }` que venen de
 * respostes d'API, i qualsevol altra cosa (que cau al text de reserva).
 */
export function getErrorMessage(error: unknown, fallback: string = UNKNOWN_ERROR_MESSAGE): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === 'string') {
    return error.trim() || fallback;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const { message } = error as { message: unknown };
    if (typeof message === 'string' && message.trim()) return message;
  }

  return fallback;
}
