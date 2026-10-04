import { notFound } from "next/navigation";
import { chapters, bySection, categorize, GROUPED_CHAPTERS, shortTitle } from "@/lib/docs";
import { PageHeader } from "@/components/PageHeader";
import { DocList } from "@/components/DocList";
export default function ChapterPage({ params }: { params: { n: string } }) {
  const n = Number(params.n);
  const ch = chapters.find((c) => c.n === n);
  if (!ch) notFound();
  const docs = bySection("chapter", n);
  return (
    <div>
      <PageHeader eyebrow={`Chương ${n}`} title={shortTitle(ch.title)} sub={`${docs.length} tài liệu`} />
      {GROUPED_CHAPTERS.has(n) ? (
        <div className="space-y-3">
          {categorize(docs).map((g, i) => (
            <details key={g.key} open={i === 0} className="rounded-2xl border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-bold text-[#0f3b40]">{g.label} <span className="font-normal text-slate-400">({g.docs.length})</span></summary>
              <div className="mt-3"><DocList docs={g.docs} /></div>
            </details>
          ))}
        </div>
      ) : (
        <DocList docs={docs} />
      )}
    </div>
  );
}
