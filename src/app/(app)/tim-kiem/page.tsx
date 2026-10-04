import Link from "next/link";
import { allDocs, shortTitle, type Doc } from "@/lib/docs";
import { search, snippet, sectionLabel, norm } from "@/lib/rag";
import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icons";

export const dynamic = "force-dynamic";

function groupName(d: Doc) {
  return d.section === "chapter" ? `Chương ${d.sectionOrder} · ${shortTitle(d.sectionTitle)}` : d.section === "handbook" ? "Sổ tay" : "Tài liệu khác";
}

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").slice(0, 200).trim();
  const terms = norm(q).split(/\s+/).filter(Boolean);
  const byName = q ? allDocs.filter((d) => terms.every((t) => norm(`${d.name} ${d.group}`).includes(t))).slice(0, 60) : [];
  const groups = new Map<string, Doc[]>();
  byName.forEach((d) => { const g = groupName(d); groups.set(g, [...(groups.get(g) ?? []), d]); });
  const byContent = q.length >= 2 ? search(q, 20, 2) : [];
  return (
    <div>
      <PageHeader eyebrow="Tìm kiếm" title={q ? `Kết quả cho “${q}”` : "Tìm kiếm toàn hệ thống"} sub="Tìm theo tên tài liệu, chương, biểu mẫu và nội dung bên trong tài liệu" />
      <form action="/tim-kiem" className="mb-8 flex gap-2">
        <input name="q" defaultValue={q} autoFocus placeholder="Nhập từ khóa (không cần gõ dấu)..." className="h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-base outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20" />
        <button className="flex h-12 items-center gap-2 rounded-xl bg-[#0f3b40] px-5 font-semibold text-white transition hover:bg-teal-700"><Icon name="search" />Tìm</button>
      </form>
      {q && (
        <div className="grid gap-8 xl:grid-cols-2">
          <section>
            <h3 className="font-display mb-3 text-xl font-semibold text-[#0f3b40]">Theo tên tài liệu <span className="text-base font-normal text-slate-400">({byName.length})</span></h3>
            {byName.length === 0 && <p className="text-sm text-slate-500">Không có tài liệu nào có tên phù hợp.</p>}
            {Array.from(groups.entries()).map(([g, list]) => (
              <div key={g} className="mb-4">
                <p className="mb-1 text-[13px] font-bold uppercase tracking-wider text-slate-500">{g}</p>
                <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {list.map((d) => <li key={d.id}><Link href={`/tai-lieu/${d.id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-teal-50/70"><span className="w-10 text-[11px] font-bold text-slate-400">{d.ext.toUpperCase()}</span><span className="min-w-0 flex-1 truncate font-medium">{d.name.replace(/\.[^.]+$/, "")}</span></Link></li>)}
                </ul>
              </div>
            ))}
          </section>
          <section>
            <h3 className="font-display mb-3 text-xl font-semibold text-[#0f3b40]">Theo nội dung <span className="text-base font-normal text-slate-400">({byContent.length})</span></h3>
            {byContent.length === 0 && <p className="text-sm text-slate-500">Không tìm thấy trong nội dung tài liệu.</p>}
            <ul className="space-y-3">
              {byContent.map((h, i) => (
                <li key={i}><Link href={`/tai-lieu/${h.doc.id}`} className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-teal-400 hover:shadow-md">
                  <p className="truncate text-[15px] font-bold text-[#12343a]">{h.doc.name.replace(/\.[^.]+$/, "")}</p>
                  <p className="text-xs text-teal-700">{sectionLabel(h.doc)} · trang {h.page}</p>
                  <p className="mt-1.5 text-sm text-slate-600">{snippet(h.text, q)}</p>
                </Link></li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
