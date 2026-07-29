function normalizeForCompare(input: string): string {
  return input
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function isProbablyRawLeadTextMessage(message: string, sourceText: string): boolean {
  const normalizedMessage = normalizeForCompare(message);
  if (!normalizedMessage) return false;
  if (normalizedMessage.length > 700) return true;

  const normalizedSource = normalizeForCompare(sourceText);
  const sampleLength = Math.min(140, normalizedMessage.length);
  const sample = normalizedMessage.slice(0, sampleLength);
  return sample.length >= 80 && normalizedSource.includes(sample);
}

export function mergeExtractedLeadMessage(
  previousMessage: string,
  extractedMessage: unknown,
  sourceText: string,
): string {
  if (typeof extractedMessage !== 'string') return previousMessage;
  const summary = extractedMessage.trim();
  if (!summary || isProbablyRawLeadTextMessage(summary, sourceText)) {
    return previousMessage;
  }

  const current = previousMessage.trim();
  if (!current) return summary;

  const normalizedCurrent = normalizeForCompare(current);
  const normalizedSummary = normalizeForCompare(summary);
  if (normalizedCurrent.includes(normalizedSummary)) return current;

  return `${current}\n\n${summary}`;
}
