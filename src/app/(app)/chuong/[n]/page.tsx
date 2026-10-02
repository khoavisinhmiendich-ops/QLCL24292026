import { notFound } from "next/navigation";
import { chapters, bySection } from "@/lib/docs";
import { DocList } from "@/components/DocList";
export default function ChapterPage({ params }: { params: { n: string } }) {
  const n = Number(params.n);
  const ch = chapters.find((c) => c.n === n);
  if (!ch) notFound();
  const docs = bySection("chapter", n);
  return (<div><h2 className="text-xl font-bold">{ch.title}</h2><p className="mb-4 text-sm text-slate-500">{docs.length} tài liệu</p><DocList docs={docs} /></div>);
}
