import { MAX_STARS } from "@/lib/stars";

export default function Stars({ count, className = "" }: { count: number; className?: string }) {
  return (
    <span className={`inline-flex text-amber-400 ${className}`} aria-label={`${count} sao`}>
      {Array.from({ length: MAX_STARS }, (_, i) => (
        <span key={i} className={i < count ? "text-amber-400" : "text-slate-200"}>
          ★
        </span>
      ))}
    </span>
  );
}
