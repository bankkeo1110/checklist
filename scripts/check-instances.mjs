import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const instances = await prisma.taskInstance.findMany({ include: { task: true, child: true } });
console.log(JSON.stringify(instances, null, 2));
await prisma.$disconnect();
