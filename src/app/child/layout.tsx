import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Header from "@/components/Header";

export default async function ConLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.kind !== "child") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header label={session.label} sublabel="Con" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
