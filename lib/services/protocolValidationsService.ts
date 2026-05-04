import { Prisma, SettingType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const PROTOCOL_VALIDATION_SETTING_KEY = 'protocol.canviValidations';
const PROTOCOL_VALIDATION_SETTING_CATEGORY = 'protocol';

export interface CanviValidation {
  canviN: number;
  validatedAt: string;
  validatedBy: string;
  notes?: string;
}

export interface CanviValidationsSummary {
  totalCanvis: number;
  validatedCount: number;
  pendingCount: number;
  validatedPercent: number;
}

export interface RecordCanviValidationInput {
  canviN: number;
  validatedBy: string;
  notes?: string;
  now?: Date;
}

export type CanviValidationsMap = Map<number, CanviValidation>;

function isValidCanviValidation(input: unknown): input is CanviValidation {
  if (!input || typeof input !== 'object') return false;
  const record = input as Record<string, unknown>;
  return (
    typeof record.canviN === 'number'
    && Number.isInteger(record.canviN)
    && record.canviN > 0
    && typeof record.validatedAt === 'string'
    && record.validatedAt.length > 0
    && typeof record.validatedBy === 'string'
    && record.validatedBy.length > 0
    && (record.notes === undefined || typeof record.notes === 'string')
  );
}

function parseValidationsPayload(raw: string): CanviValidation[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidCanviValidation);
  } catch {
    return [];
  }
}

export function summarizeValidations(
  totalCanvis: number,
  validations: CanviValidationsMap,
): CanviValidationsSummary {
  const safeTotal = Math.max(0, totalCanvis);
  const validatedCount = Math.min(safeTotal, validations.size);
  const pendingCount = Math.max(0, safeTotal - validatedCount);
  const validatedPercent = safeTotal === 0 ? 0 : Math.round((validatedCount / safeTotal) * 1000) / 10;
  return { totalCanvis: safeTotal, validatedCount, pendingCount, validatedPercent };
}

export async function loadCanviValidations(): Promise<CanviValidationsMap> {
  const setting = await prisma.setting.findUnique({
    where: { key: PROTOCOL_VALIDATION_SETTING_KEY },
  });
  if (!setting) return new Map();
  const validations = parseValidationsPayload(setting.value);
  const map: CanviValidationsMap = new Map();
  for (const validation of validations) {
    map.set(validation.canviN, validation);
  }
  return map;
}

async function persistValidations(validations: CanviValidation[]): Promise<void> {
  const value = JSON.stringify(validations);
  await prisma.setting.upsert({
    where: { key: PROTOCOL_VALIDATION_SETTING_KEY },
    update: { value },
    create: {
      key: PROTOCOL_VALIDATION_SETTING_KEY,
      value,
      type: SettingType.JSON,
      category: PROTOCOL_VALIDATION_SETTING_CATEGORY,
      label: 'Validacions humanes dels Canvis del protocol',
      description: 'Registre de quins Canvis #N han passat per validació humana segons §2.1.',
    },
  });
  await prisma.adminLog.create({
    data: {
      action: 'UPDATE',
      entity: 'setting',
      details: { key: PROTOCOL_VALIDATION_SETTING_KEY, count: validations.length } as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function recordCanviValidation(input: RecordCanviValidationInput): Promise<CanviValidation> {
  if (!Number.isInteger(input.canviN) || input.canviN <= 0) {
    throw new Error('canviN must be a positive integer');
  }
  const validatedBy = input.validatedBy.trim();
  if (validatedBy.length === 0) {
    throw new Error('validatedBy is required');
  }
  const notes = input.notes?.trim() ?? undefined;
  const now = (input.now ?? new Date()).toISOString();
  const map = await loadCanviValidations();
  const validation: CanviValidation = {
    canviN: input.canviN,
    validatedAt: now,
    validatedBy,
    ...(notes ? { notes } : {}),
  };
  map.set(input.canviN, validation);
  await persistValidations(Array.from(map.values()));
  return validation;
}

export async function removeCanviValidation(canviN: number): Promise<boolean> {
  if (!Number.isInteger(canviN) || canviN <= 0) {
    throw new Error('canviN must be a positive integer');
  }
  const map = await loadCanviValidations();
  if (!map.has(canviN)) return false;
  map.delete(canviN);
  await persistValidations(Array.from(map.values()));
  return true;
}
