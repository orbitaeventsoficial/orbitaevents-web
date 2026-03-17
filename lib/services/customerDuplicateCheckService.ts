import { findDuplicates } from '@/lib/services/deduplicationService';

type DuplicateCheckInput = {
  name?: string;
  email?: string;
  phone?: string;
  instagram?: string;
};

export async function checkCustomerDuplicates(input: DuplicateCheckInput) {
  const { name, email, phone, instagram } = input;

  if (!name && !email && !phone && !instagram) {
    return { ok: true, duplicates: [] };
  }

  const duplicates = await findDuplicates({
    name: name || undefined,
    email: email || undefined,
    phone: phone || undefined,
    instagram: instagram || undefined,
  });

  return {
    ok: true,
    duplicates: duplicates.slice(0, 5).map((duplicate) => ({
      id: duplicate.customer.id,
      name: duplicate.customer.name,
      email: duplicate.customer.email,
      phone: duplicate.customer.phone,
      matchScore: duplicate.matchScore,
      matchReasons: duplicate.matchReasons.map((reason) => ({
        field: reason.field,
        type: reason.type,
        score: reason.score,
      })),
    })),
  };
}
