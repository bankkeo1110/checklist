"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/phu-huynh", label: "Duyệt" },
  { href: "/phu-huynh/nhiem-vu", label: "Quản lý nhiệm vụ" },
  { href: "/phu-huynh/checklist", label: "Checklist ngủ" },
  { href: "/phu-huynh/lich-su", label: "Lịch sử & Mục tiêu" },
];

export default function ParentNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1.5 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-md">
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
    </nav>
  );
}
