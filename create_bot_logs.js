
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Creating bot_logs table...');

    // Create the bot_logs table directly via raw SQL
    await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "bot_logs" (
      "id" TEXT NOT NULL,
      "clientId" TEXT NOT NULL,
      "functionName" TEXT NOT NULL,
      "inputArgs" TEXT NOT NULL,
      "resultJson" TEXT,
      "slotsFound" INTEGER,
      "scheduleUsed" TEXT,
      "errorMsg" TEXT,
      "durationMs" INTEGER,
      "webhookUrl" TEXT,
      "confirmed" BOOLEAN,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "bot_logs_pkey" PRIMARY KEY ("id")
    )
  `;

    console.log('✅ bot_logs table created (or already exists)');

    // Verify it works with a test insert
    const testId = 'test-' + Date.now();
    await prisma.$executeRaw`
    INSERT INTO "bot_logs" ("id", "clientId", "functionName", "inputArgs", "createdAt")
    VALUES (${testId}, 'test-client', 'test', '{}', NOW())
  `;

    console.log('✅ Test insert successful');

    // Clean up
    await prisma.$executeRaw`DELETE FROM "bot_logs" WHERE "id" = ${testId}`;
    console.log('✅ Test cleaned up. Bot logs ready!');

    await prisma.$disconnect();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
