import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Header from "@/components/Header";

export default async function ChildLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.kind !== "child") {
    redirect("/");
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
      <Header name={session.label} caption="Chào mừng trở lại! 🎈" personName={session.name} />
      {children}
    </div>
  );
}
