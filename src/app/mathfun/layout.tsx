import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Nav from "@/components/mathfun/Nav";
import "./mathfun.css";

export default async function MathFunLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/");

  return (
    <div className="mathfun-root flex min-h-full flex-1 flex-col">
      <Nav backHref={session.kind === "child" ? "/child" : "/phu-huynh"} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
