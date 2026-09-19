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
    <div className="flex min-h-screen flex-col">
      <Header name={session.label} roleLabel="Ba / Mẹ" personName={session.name} />
      <ParentNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
