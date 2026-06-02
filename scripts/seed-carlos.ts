import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const carlos = await prisma.collaborator.upsert({
    where: { id: 'carlos-lucas-fernandez' },
    update: {
      name: 'Carlos Lucas Fernández',
      company: 'Masquerade Events',
      phone: '691748306',
      specialty: 'Presentador d\'esdeveniments',
      costPerHour: 100,
      commissionPct: 0,
      notes: 'Tarifa: 100€/h com a presentador. Per a Bingo Musical o Batalla Musical (1,5h): 150€ Carlos + ~50€ tècnic de so + material = 200€ total. Usable de forma independent per a qualsevol presentació.',
      isActive: true,
    },
    create: {
      id: 'carlos-lucas-fernandez',
      name: 'Carlos Lucas Fernández',
      company: 'Masquerade Events',
      phone: '691748306',
      specialty: 'Presentador d\'esdeveniments',
      costPerHour: 100,
      commissionPct: 0,
      notes: 'Tarifa: 100€/h com a presentador. Per a Bingo Musical o Batalla Musical (1,5h): 150€ Carlos + ~50€ tècnic de so + material = 200€ total. Usable de forma independent per a qualsevol presentació.',
      isActive: true,
    },
  });

  console.log(`Carlos: ${carlos.name} — ${carlos.costPerHour}€/h (${carlos.specialty})\n${carlos.notes}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
