import { ExternalLink } from "lucide-react";

export const MATHFUN_URL = "https://otisliam.vercel.app/";

/** Menu item for the kids' MathFun site; opens in a new tab so this app stays open. */
export default function MathFunLink() {
  return (
    <a
      href={MATHFUN_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 font-display text-[12.5px] font-bold text-purple-text hover:bg-purple-tint"
    >
      🧮 MathFun
      <ExternalLink size={13} strokeWidth={2.4} />
    </a>
  );
}
