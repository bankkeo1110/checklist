import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPin(pin) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pin, salt, 32);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

const TEST_PIN = "0000";

async function main() {
  const child = await prisma.child.upsert({
    where: { name: "TEST" },
    update: {},
    create: {
      name: "TEST",
      label: "Bé Test",
      color: "#8A8592",
      pinHash: hashPin(TEST_PIN),
    },
  });

  const activeTasks = await prisma.task.findMany({ where: { active: true }, select: { id: true } });
  await prisma.child.update({
    where: { id: child.id },
    data: { tasks: { connect: activeTasks.map((t) => ({ id: t.id })) } },
  });

  console.log(`Test child ready: id=${child.id}, label="${child.label}", PIN=${TEST_PIN}`);
  console.log(`Assigned to ${activeTasks.length} active task(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
