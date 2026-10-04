import { notFound } from "next/navigation";
import { bySection, categorize } from "@/lib/docs";
import { DocList } from "@/components/DocList";
import { PageHeader } from "@/components/PageHeader";
const T: Record<string, string> = { handbook: "Sổ tay", other: "Tài liệu khác" };
export default function SectionPage({ params }: { params: { kind: string } }) {
  if (!T[params.kind]) notFound();
  const docs = bySection(params.kind);
  return (
    <div>
      <PageHeader eyebrow="Tài liệu" title={T[params.kind]} sub={`${docs.length} tài liệu`} />
      <div className="space-y-3">
        {categorize(docs).map((g, i) => (
          <details key={g.key} open={i === 0} className="rounded-2xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-bold text-[#0f3b40]">{g.label} <span className="font-normal text-slate-400">({g.docs.length})</span></summary>
            <div className="mt-3"><DocList docs={g.docs} /></div>
          </details>
        ))}
      </div>
    </div>
  );
}
