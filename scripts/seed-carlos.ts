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
      costPerHour: 133.33,
      commissionPct: 0,
      notes: '200€ per 1,5h (Bingo Musical o Batalla Musical). Cost/hora calculat: 200 ÷ 1,5 = 133,33€/h.',
      isActive: true,
    },
    create: {
      id: 'carlos-lucas-fernandez',
      name: 'Carlos Lucas Fernández',
      company: 'Masquerade Events',
      phone: '691748306',
      specialty: 'Presentador d\'esdeveniments',
      costPerHour: 133.33,
      commissionPct: 0,
      notes: '200€ per 1,5h (Bingo Musical o Batalla Musical). Cost/hora calculat: 200 ÷ 1,5 = 133,33€/h.',
      isActive: true,
    },
  });

  console.log('Carlos creat/actualitzat:', carlos.name, '—', carlos.costPerHour, '€/h');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
