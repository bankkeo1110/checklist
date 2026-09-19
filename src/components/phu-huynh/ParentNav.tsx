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
    <nav className="border-b border-divider bg-canvas">
      <div className="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-4">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap border-b-2 px-3 py-3 font-heading text-[13px] font-semibold ${
                active ? "border-accent-700 text-accent-700" : "border-transparent text-ink/60 hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
