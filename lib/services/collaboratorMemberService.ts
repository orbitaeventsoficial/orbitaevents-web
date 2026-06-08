import { prisma } from '@/lib/prisma';
import { COLLABORATOR_MEMBER_ROLE_OPTIONS } from '@/lib/constants/admin';

type MemberInput = {
  name?: string;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  isActive?: boolean | null;
  sortOrder?: number | null;
};

const VALID_ROLES = COLLABORATOR_MEMBER_ROLE_OPTIONS.map((option) => option.value) as readonly string[];

function normalizeRole(value?: string | null): string {
  return value && VALID_ROLES.includes(value) ? value : 'OTHER';
}

export async function listCollaboratorMembers(collaboratorId: string) {
  const members = await prisma.collaboratorMember.findMany({
    where: { collaboratorId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  return { status: 200, body: { members } };
}

export async function createCollaboratorMember(collaboratorId: string, input: MemberInput) {
  if (!input.name?.trim()) {
    return { status: 400, body: { error: 'El nom és obligatori' } };
  }
  if (input.role != null && input.role !== '' && !VALID_ROLES.includes(input.role)) {
    return { status: 400, body: { error: 'Rol no vàlid' } };
  }
  const member = await prisma.collaboratorMember.create({
    data: {
      collaboratorId,
      name: input.name.trim(),
      role: normalizeRole(input.role),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      notes: input.notes?.trim() || null,
      sortOrder: input.sortOrder ?? 0,
    },
  });
  return { status: 201, body: member };
}

export async function updateCollaboratorMember(memberId: string, input: MemberInput) {
  if (input.role != null && input.role !== '' && !VALID_ROLES.includes(input.role)) {
    return { status: 400, body: { error: 'Rol no vàlid' } };
  }
  const member = await prisma.collaboratorMember.update({
    where: { id: memberId },
    data: {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.role !== undefined && { role: normalizeRole(input.role) }),
      ...(input.phone !== undefined && { phone: input.phone?.trim() || null }),
      ...(input.email !== undefined && { email: input.email?.trim() || null }),
      ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
      ...(input.isActive !== undefined && { isActive: Boolean(input.isActive) }),
      ...(input.sortOrder !== undefined && input.sortOrder != null && { sortOrder: input.sortOrder }),
    },
  });
  return { status: 200, body: member };
}

export async function deleteCollaboratorMember(memberId: string) {
  await prisma.collaboratorMember.delete({ where: { id: memberId } });
  return { status: 200, body: { ok: true } };
}
