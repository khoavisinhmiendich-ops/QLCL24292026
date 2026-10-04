export function PageHeader({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <header className="mb-6">
      {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">{eyebrow}</p>}
      <h2 className="font-display mt-1 text-[32px] font-semibold leading-tight text-[#0f3b40]">{title}</h2>
      {sub && <p className="mt-1 text-base text-slate-500">{sub}</p>}
    </header>
  );
}
