import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.platformConfig.findFirst();
  if (!existing) {
    await prisma.platformConfig.create({
      data: {
        depositAddress: 'TELEXuLxzbW6ejKTL6qKJE48UA3LQDaBo',
        miningDailyRate: 0.005,
        minDeposit: 10,
        minWithdrawal: 10,
        whatsappLink: '',
        telegramLink: '',
      },
    });
    console.log('PlatformConfig seeded.');
  } else {
    console.log('PlatformConfig already exists — skipping.');
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
