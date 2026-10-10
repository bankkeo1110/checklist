import { Check, X, Clock } from "lucide-react";

// Pure presentational checkbox-styled status square — shared by the
// interactive WeeklyGrid (child's own page) and the read-only status view
// ("Tình trạng con", parent-facing). No "use client" needed since it has no
// state/handlers, so importing it from a server component stays zero-JS.
export default function TaskStatusCell({ status }: { status: string }) {
  if (status === "APPROVED") {
    return (
      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border-2 border-green bg-green">
        <Check size={17} strokeWidth={2.5} className="text-white" />
      </span>
    );
  }
  if (status === "CLAIMED") {
    return (
      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border-2 border-orange bg-[#fff1e2] text-orange">
        <Clock size={15} strokeWidth={1.8} />
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span
        className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border-2"
        style={{ borderColor: "#e7a79e", background: "#fbedec" }}
      >
        <X size={14} strokeWidth={2} style={{ color: "#c4736b" }} />
      </span>
    );
  }
  return (
    <span className="flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-[#f7f5f9] text-[14px] text-[#c7c3cc]">
      ·
    </span>
  );
}
