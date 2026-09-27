import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DEFAULT_CHILD_PIN } from "@/lib/pin";
import PinChangeForm from "@/components/phu-huynh/PinChangeForm";

export const dynamic = "force-dynamic";

export default async function PinSettingsPage() {
  const session = await getSession();
  if (!session || session.kind !== "parent") redirect("/");

  const kids = await prisma.child.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">Mã PIN</h1>
        <p className="text-sm font-semibold text-muted">Đổi mã PIN đăng nhập của bạn hoặc của các con.</p>
      </div>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-[15px] font-bold">🔒 Mã PIN của {session.label}</h2>
        <PinChangeForm kind="parent" id={session.id} title="Đổi mã PIN của bạn" requireCurrent />
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-[15px] font-bold">🧒 Mã PIN của các con</h2>
        {kids.map((child) => (
          <PinChangeForm
            key={child.id}
            kind="child"
            id={child.id}
            title={`Đặt mã PIN mới cho ${child.label}`}
            defaultPin={DEFAULT_CHILD_PIN}
          />
        ))}
      </section>
    </div>
  );
}
