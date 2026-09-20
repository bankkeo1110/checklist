import { Star } from "lucide-react";

export default function Stars({ count, size = 12 }: { count: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 font-bold text-yellow" aria-label={`${count} sao`}>
      <Star size={size} strokeWidth={1.8} fill="currentColor" />
      <span style={{ fontSize: size * 0.85 }}>{count}</span>
    </span>
  );
}
