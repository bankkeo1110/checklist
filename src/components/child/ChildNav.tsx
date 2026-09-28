"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MathFunLink from "@/components/MathFunLink";

const LINKS = [{ href: "/child", label: "🏠 Trang của con" }];

export default function ChildNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1.5 rounded-2xl bg-white p-1.5 shadow-md">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-xl px-3.5 py-2.5 font-display text-[12.5px] font-bold ${
              active ? "bg-blue text-white" : "text-muted hover:bg-divider"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
      <MathFunLink />
    </nav>
  );
}
