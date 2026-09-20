import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Header from "@/components/Header";
import ParentNav from "@/components/phu-huynh/ParentNav";

export default async function PhuHuynhLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.kind !== "parent") {
    redirect("/");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6">
      <Header name={session.label} caption="Bảng điều khiển phụ huynh" personName={session.name} />
      <ParentNav />
      {children}
    </div>
  );
}
