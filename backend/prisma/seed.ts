import { ClientType, PipelineStage, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DAY_MS = 1000 * 60 * 60 * 24;

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * DAY_MS);
}

async function main(): Promise<void> {
  const existing = await prisma.client.count();
  if (existing > 0) {
    console.log(`[seed] ${existing} clients already present, skipping seed.`);
    return;
  }

  const acme = await prisma.client.create({
    data: {
      type: ClientType.COMPANY,
      companyName: 'Acme Corporation',
      registrationNumber: '12345678900011',
      industry: 'Manufacturing',
      email: 'contact@acme.example',
      phone: '+33 1 23 45 67 89',
    },
  });

  const globex = await prisma.client.create({
    data: {
      type: ClientType.COMPANY,
      companyName: 'Globex SA',
      registrationNumber: '98765432100022',
      industry: 'Software',
      email: 'sales@globex.example',
    },
  });

  const jane = await prisma.client.create({
    data: {
      type: ClientType.INDIVIDUAL,
      firstName: 'Jane',
      lastName: 'Martin',
      email: 'jane.martin@example.com',
      phone: '+33 6 11 22 33 44',
    },
  });

  const paul = await prisma.client.create({
    data: {
      type: ClientType.INDIVIDUAL,
      firstName: 'Paul',
      lastName: 'Durand',
      email: 'paul.durand@example.com',
    },
  });

  await prisma.opportunity.createMany({
    data: [
      // Healthy: future close date, recently moved stage
      {
        title: 'Acme - annual platform license',
        amount: 48000,
        expectedCloseDate: daysFromNow(25),
        stage: PipelineStage.PROPOSAL,
        stageChangedAt: daysFromNow(-2),
        clientId: acme.id,
      },
      // LATE: expected close date in the past, not closed
      {
        title: 'Acme - support renewal',
        amount: 12000,
        expectedCloseDate: daysFromNow(-7),
        stage: PipelineStage.NEGOTIATION,
        stageChangedAt: daysFromNow(-3),
        clientId: acme.id,
      },
      // STAGNANT: no stage change for well over the threshold (default 14d)
      {
        title: 'Globex - data migration project',
        amount: 30000,
        expectedCloseDate: daysFromNow(40),
        stage: PipelineStage.QUALIFIED,
        stageChangedAt: daysFromNow(-45),
        clientId: globex.id,
      },
      // Healthy early-stage
      {
        title: 'Globex - pilot program',
        amount: 5000,
        expectedCloseDate: daysFromNow(15),
        stage: PipelineStage.NEW,
        stageChangedAt: daysFromNow(-1),
        clientId: globex.id,
      },
      // WON (terminal)
      {
        title: 'Jane - consulting package',
        amount: 8000,
        expectedCloseDate: daysFromNow(-20),
        stage: PipelineStage.WON,
        stageChangedAt: daysFromNow(-20),
        clientId: jane.id,
      },
      // LOST (terminal)
      {
        title: 'Paul - training sessions',
        amount: 3500,
        expectedCloseDate: daysFromNow(-30),
        stage: PipelineStage.LOST,
        stageChangedAt: daysFromNow(-25),
        clientId: paul.id,
      },
      // Another healthy negotiation
      {
        title: 'Jane - extended retainer',
        amount: 15000,
        expectedCloseDate: daysFromNow(10),
        stage: PipelineStage.NEGOTIATION,
        stageChangedAt: daysFromNow(-4),
        clientId: jane.id,
      },
    ],
  });

  const [clients, opportunities] = await Promise.all([
    prisma.client.count(),
    prisma.opportunity.count(),
  ]);
  console.log(`[seed] created ${clients} clients and ${opportunities} opportunities.`);
}

main()
  .catch((error) => {
    console.error('[seed] failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
