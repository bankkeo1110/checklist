import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

await prisma.pointLedger.deleteMany({});
await prisma.taskInstance.deleteMany({});
await prisma.bedtimeLog.deleteMany({});
await prisma.bedtimeItem.deleteMany({ where: { label: "Test item from Playwright" } });
await prisma.weeklyGoal.deleteMany({});

console.log("Cleanup complete.");
await prisma.$disconnect();
