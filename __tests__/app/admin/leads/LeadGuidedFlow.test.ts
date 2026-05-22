import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('LeadGuidedFlow hook dependencies', () => {
  const source = readFileSync(
    join(process.cwd(), 'app', 'admin', 'leads', '[id]', 'LeadGuidedFlow.tsx'),
    'utf8',
  );

  it('keeps status updates stable without suppressing exhaustive deps', () => {
    expect(source).toContain('const updateStatus = useCallback(async (nextStatus: LeadStatus)');
    expect(source).toContain(
      '}, [currentIndex, isLost, hasBooking, bookingId, leadId, updateStatus]);',
    );
    expect(source).not.toContain('eslint-disable-next-line react-hooks/exhaustive-deps');
  });
});
