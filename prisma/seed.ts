import { PrismaClient } from "@prisma/client";
import { hashPin } from "../src/lib/pin";

const prisma = new PrismaClient();

const SEED_TASKS: { title: string; points: number }[] = [
  { title: "Hoàn thành bài tập ở lớp", points: 2 },
  { title: "Đọc Raz-Kids + nghe audio", points: 2 },
  { title: "Đọc sách 30 phút", points: 2 },
  { title: "Tự chuẩn bị / cất cặp", points: 1 },
  { title: "Gấp chăn + dọn giường", points: 1 },
  { title: "Rửa bát", points: 2 },
  { title: "Lau nhà", points: 2 },
  { title: "Dọn bàn học", points: 1 },
  { title: "Đi bộ / chạy ngoài trời (3 buổi/tuần)", points: 2 },
  { title: "Chủ động giúp bố mẹ", points: 1 },
];

const SEED_BEDTIME_ITEMS: string[] = [
  "Cặp sách đã chuẩn bị",
  "Quần áo ngày mai đã chuẩn bị",
  "Bàn học đã gọn",
  "Sách đã cất đúng chỗ",
  "Việc ngày hôm nay đã hoàn thành",
  "Đã đánh răng / rửa mặt",
];

async function main() {
  const otis = await prisma.child.upsert({
    where: { name: "OTIS" },
    update: {},
    create: {
      name: "OTIS",
      label: "Otis",
      color: "#2563eb",
      pinHash: hashPin("1111"),
    },
  });

  const liam = await prisma.child.upsert({
    where: { name: "LIAM" },
    update: {},
    create: {
      name: "LIAM",
      label: "Liam",
      color: "#16a34a",
      pinHash: hashPin("2222"),
    },
  });

  await prisma.parent.upsert({
    where: { name: "TINH" },
    update: {},
    create: {
      name: "TINH",
      label: "Ba (Tình)",
      pinHash: hashPin("1234"),
    },
  });

  await prisma.parent.upsert({
    where: { name: "LOAN" },
    update: {},
    create: {
      name: "LOAN",
      label: "Mẹ (Loan)",
      pinHash: hashPin("5678"),
    },
  });

  for (const t of SEED_TASKS) {
    const existing = await prisma.task.findFirst({ where: { title: t.title } });
    if (existing) continue;
    await prisma.task.create({
      data: {
        title: t.title,
        points: t.points,
        assignedTo: { connect: [{ id: otis.id }, { id: liam.id }] },
      },
    });
  }

  for (let i = 0; i < SEED_BEDTIME_ITEMS.length; i++) {
    const label = SEED_BEDTIME_ITEMS[i];
    const existing = await prisma.bedtimeItem.findFirst({ where: { label } });
    if (existing) continue;
    await prisma.bedtimeItem.create({
      data: { label, sortOrder: i },
    });
  }

  console.log("Seed complete.");
  console.log("PINs — Otis: 1111, Liam: 2222, Ba (Tình): 1234, Mẹ (Loan): 5678");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
