import { Loader2 } from "lucide-react";

export default function Spinner({ size = 16, className = "" }: { size?: number; className?: string }) {
  return <Loader2 size={size} strokeWidth={2.5} className={`animate-spin ${className}`} aria-label="Đang xử lý" />;
}
