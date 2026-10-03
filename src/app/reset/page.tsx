import { prisma } from "@/lib/prisma";
import ResetParentPinForm from "@/components/ResetParentPinForm";

// Hidden recovery page — no session required (a locked-out parent has none
// to show), no link to it anywhere in the UI. Known only by its URL.
export const dynamic = "force-dynamic";

export default async function ResetPage() {
  const parents = await prisma.parent.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-7 px-6 py-12">
      <ResetParentPinForm parents={parents.map((p) => ({ id: p.id, name: p.name, label: p.label }))} />
    </div>
  );
}
