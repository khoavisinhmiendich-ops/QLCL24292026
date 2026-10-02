import Link from "next/link";
import { fmtSize, type Doc } from "@/lib/docs";
const badge: Record<string, string> = { pdf: "bg-red-100 text-red-700", word: "bg-blue-100 text-blue-700", excel: "bg-emerald-100 text-emerald-700", image: "bg-purple-100 text-purple-700" };
export function DocList({ docs }: { docs: Doc[] }) {
  const groups = new Map<string, Doc[]>();
  docs.forEach((d) => { const g = d.group || "(Thư mục gốc)"; groups.set(g, [...(groups.get(g) ?? []), d]); });
  return (
    <div className="space-y-5">
      {Array.from(groups.entries()).map(([g, list]) => (
        <section key={g}>
          <h3 className="mb-1 text-sm font-semibold text-slate-600">{g}</h3>
          <ul className="divide-y rounded-lg border bg-white">
            {list.map((d) => (
              <li key={d.id}>
                <Link href={`/tai-lieu/${d.id}`} className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-brand-50">
                  <span className={`w-14 rounded px-2 py-0.5 text-center text-xs font-medium ${badge[d.type] ?? "bg-slate-100"}`}>{d.ext.toUpperCase()}</span>
                  <span className="min-w-0 flex-1 truncate">{d.name}</span>
                  <span className="text-xs text-slate-400">{fmtSize(d.size)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
