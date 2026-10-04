import Link from "next/link";
import { fmtSize, type Doc } from "@/lib/docs";
const T: Record<string, { l: string; c: string }> = {
  pdf: { l: "PDF", c: "bg-red-50 text-red-600 ring-red-100" },
  word: { l: "DOC", c: "bg-blue-50 text-blue-600 ring-blue-100" },
  excel: { l: "XLS", c: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  image: { l: "IMG", c: "bg-violet-50 text-violet-600 ring-violet-100" },
};
export function DocList({ docs }: { docs: Doc[] }) {
  const groups = new Map<string, Doc[]>();
  docs.forEach((d) => { const g = d.group || "Tài liệu chung của chương"; groups.set(g, [...(groups.get(g) ?? []), d]); });
  return (
    <div className="space-y-5">
      {Array.from(groups.entries()).map(([g, list]) => (
        <section key={g} className="animate-rise">
          <h3 className="mb-2 text-[13px] font-bold uppercase tracking-wider text-slate-500">{g}</h3>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {list.map((d) => {
              const t = T[d.type] ?? { l: d.ext.toUpperCase().slice(0, 3), c: "bg-slate-50 text-slate-600 ring-slate-100" };
              return (
                <li key={d.id}>
                  <Link href={`/tai-lieu/${d.id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm transition duration-200 hover:bg-teal-50/70 hover:pl-5">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ring-1 ${t.c}`}>{t.l}</span>
                    <span className="min-w-0 flex-1 truncate font-medium text-[#12343a]">{d.name.replace(/\.[^.]+$/, "")}</span>
                    <span className="text-xs text-slate-400">{fmtSize(d.size)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
