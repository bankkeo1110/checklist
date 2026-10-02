"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const AVATAR_COLORS = ["bg-red-400", "bg-blue-400", "bg-purple-400", "bg-green-500", "bg-orange-400"];
function colorForName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

interface MathfunUser {
  studentId: number;
  name: string;
  avatar?: string | null;
}

export default function Nav({ backHref }: { backHref: string }) {
  const pathname = usePathname();
  const [user, setUser] = useState<MathfunUser | null>(null);

  useEffect(() => {
    const fetchUser = () => {
      fetch("/api/mathfun/me")
        .then((r) => r.json())
        .then((d) => setUser(d.user ?? null));
    };
    fetchUser();
    window.addEventListener("mathapp_student_changed", fetchUser);
    return () => window.removeEventListener("mathapp_student_changed", fetchUser);
  }, []);

  const link = (href: string, label: string) => {
    const active = pathname === href || (href !== "/mathfun" && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={`font-black text-sm px-4 py-1.5 rounded-lg transition ${
          active ? "bg-[#1a1a1a] text-white" : "text-[#1a1a1a] hover:bg-black/10"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="bg-[#FFD015] border-b-4 border-[#1a1a1a] px-6 py-3 flex items-center gap-4">
      <Link href={backHref} title="Về trang chính" className="flex items-center gap-1 text-[#1a1a1a] hover:opacity-70 mr-1">
        <ArrowLeft size={18} strokeWidth={2.4} />
      </Link>
      <Link href="/mathfun" className="flex items-center gap-2 mr-4">
        <div className="bg-[#1a1a1a] text-[#FFD015] font-black text-lg w-9 h-9 rounded-xl flex items-center justify-center select-none">M</div>
        <span className="font-black text-[#1a1a1a] text-xl tracking-wide">MATH FUN</span>
      </Link>

      <div className="flex items-center gap-1 overflow-x-auto">
        {link("/mathfun", "Home")}
        {link("/mathfun/practice", "Practice")}
        {link("/mathfun/exams", "📝 Đề thi")}
        {link("/mathfun/learn", "📚 Học thêm")}
        {link("/mathfun/grow", "🌱 Grow")}
        {link("/mathfun/members", "Members")}
        {link("/mathfun/report", "Progress")}
        {link("/mathfun/dictionary", "📖 Từ điển")}
      </div>

      {user && (
        <div className="ml-auto flex items-center gap-2 flex-none">
          <Link
            href={`/mathfun/student/${user.studentId}`}
            title={user.name}
            className={
              user.avatar
                ? "card-comic-sm w-9 h-9 rounded-xl flex items-center justify-center text-xl select-none hover:opacity-90 bg-white border-2 border-[#1a1a1a]"
                : `${colorForName(user.name)} card-comic-sm text-white font-black w-9 h-9 rounded-xl flex items-center justify-center text-sm select-none hover:opacity-90`
            }
          >
            {user.avatar ?? user.name[0].toUpperCase()}
          </Link>
          <span className="font-black text-sm text-[#1a1a1a] hidden sm:block">{user.name}</span>
        </div>
      )}
    </nav>
  );
}
