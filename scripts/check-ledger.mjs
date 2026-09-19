import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const ledger = await prisma.pointLedger.findMany({ include: { child: true } });
console.log(JSON.stringify(ledger, null, 2));
const bedtime = await prisma.bedtimeLog.findMany();
console.log("bedtimeLogs:", JSON.stringify(bedtime, null, 2));
const items = await prisma.bedtimeItem.findMany();
console.log("bedtimeItems:", JSON.stringify(items.map(i => i.label), null, 2));
await prisma.$disconnect();
