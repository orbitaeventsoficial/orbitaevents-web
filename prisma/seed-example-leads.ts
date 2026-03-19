import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Creant leads d'exemple...");

  // First check if they already exist
  const existing = await prisma.lead.findMany({
    where: { name: { startsWith: 'Exemple:' } },
    select: { id: true, name: true }
  });

  if (existing.length > 0) {
    console.log(`Ja existeixen ${existing.length} leads d'exemple:`);
    existing.forEach(l => console.log(' -', l.name));
    console.log('Eliminant-los per re-crear...');
    await prisma.lead.deleteMany({ where: { name: { startsWith: 'Exemple:' } } });
  }

  const examples = [
    { name: 'Exemple: Boda Maria i Joan', email: 'exemple.boda@test.com', phone: '600111222', source: 'WEBSITE' as const, eventType: 'WEDDING' as const, status: 'NEW' as const, priority: 'HIGH' as const, message: 'DNI/NIF/CIF: 12345678A\nAdreça: Carrer Major 10, Barcelona\nBoda per a 150 convidats amb DJ i il·luminació especial' },
    { name: 'Exemple: Festa Corporativa TechCo', email: 'exemple.corp@test.com', phone: '600222333', source: 'PHONE' as const, eventType: 'CORPORATE' as const, status: 'CONTACTED' as const, priority: 'MEDIUM' as const, message: 'NIF: B12345678\nAdreça: Av. Diagonal 200, Barcelona\nFesta de Nadal empresa 80 persones amb sopar i DJ' },
    { name: 'Exemple: Aniversari 50 Pere', email: 'exemple.aniversari@test.com', phone: '600333444', source: 'REFERRAL' as const, eventType: 'BIRTHDAY' as const, status: 'CONTACTED' as const, priority: 'LOW' as const, message: 'DNI: 87654321B\nAdreça: Plaça Catalunya 5, Girona\nAniversari sorpresa amb karaoke i photocall' },
    { name: 'Exemple: Festival Estiu Municipal', email: 'exemple.festival@test.com', phone: '600444555', source: 'WEBSITE' as const, eventType: 'PRIVATE_PARTY' as const, status: 'QUOTE_SENT' as const, priority: 'HIGH' as const, message: 'CIF: G12345678\nAdreça: Parc Central, Sabadell\nFestival 3 dies amb escenari, so professional i il·luminació LED' },
    { name: 'Exemple: Comunió Martina', email: 'exemple.comunio@test.com', phone: '600555666', source: 'INSTAGRAM' as const, eventType: 'COMMUNION' as const, status: 'NEW' as const, priority: 'MEDIUM' as const, message: 'DNI: 11223344C\nAdreça: Masia Can Roca, Terrassa\nComunió 60 convidats amb animació infantil i disco' },
  ];

  for (const lead of examples) {
    const created = await prisma.lead.create({ data: lead });
    console.log('✓ Creat:', created.name, '(ID:', created.id + ')');
  }

  console.log(`\n✅ ${examples.length} leads d'exemple creats correctament!`);
  await prisma.$disconnect();
}

main().catch(e => { console.error('Error:', e); process.exit(1); });
