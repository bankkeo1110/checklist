type ChildSummary = {
  id: string;
  label: string;
  approved: number;
  pending: number;
};

export default function ParentDashboard({ children }: { children: ChildSummary[] }) {
  return (
    <section className="flex flex-col gap-2">
      <div>
        <h2 className="font-display text-lg font-bold">Tổng quan</h2>
        <p className="text-sm font-semibold text-muted">Số sao đã duyệt và đang chờ duyệt của các con.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {children.map((child) => (
          <div key={child.id} className="rounded-[20px] bg-white p-3.5 shadow-md">
            <p className="font-display text-[15px] font-bold">{child.label}</p>
            <div className="mt-1 flex gap-4 text-[12.5px] font-bold">
              <span className="text-green-text">⭐ {child.approved} đã duyệt</span>
              <span className="text-orange">⭐ {child.pending} chờ duyệt</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}