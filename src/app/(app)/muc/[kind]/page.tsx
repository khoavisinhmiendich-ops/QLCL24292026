import { notFound } from "next/navigation";
import { bySection } from "@/lib/docs";
import { DocList } from "@/components/DocList";
const T: Record<string, string> = { handbook: "Sổ tay", other: "Tài liệu khác" };
export default function SectionPage({ params }: { params: { kind: string } }) {
  if (!T[params.kind]) notFound();
  const docs = bySection(params.kind);
  return (<div><h2 className="text-xl font-bold">{T[params.kind]}</h2><p className="mb-4 text-sm text-slate-500">{docs.length} tài liệu</p><DocList docs={docs} /></div>);
}
