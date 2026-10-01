import Link from "next/link";

/** Menu item for the kids' MathFun section, now built into this app. */
export default function MathFunLink() {
  return (
    <Link
      href="/mathfun"
      className="flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 font-display text-[12.5px] font-bold text-purple-text hover:bg-purple-tint"
    >
      🧮 MathFun
    </Link>
  );
}
