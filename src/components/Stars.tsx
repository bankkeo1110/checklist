import { Star } from "lucide-react";
import { MAX_STARS } from "@/lib/stars";

export default function Stars({ count, size = 12 }: { count: number; size?: number }) {
  return (
    <span className="inline-flex gap-px text-yellow" aria-label={`${count} sao`}>
      {Array.from({ length: MAX_STARS }, (_, i) => (
        <Star key={i} size={size} strokeWidth={1.8} fill={i < count ? "currentColor" : "none"} />
      ))}
    </span>
  );
}
