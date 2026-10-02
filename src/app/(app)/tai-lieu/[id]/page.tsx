import { notFound } from "next/navigation";
import { findDoc } from "@/lib/docs";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { DocumentViewer } from "@/components/DocumentViewer";
import { AutosaveNotes } from "@/components/AutosaveNotes";
export const dynamic = "force-dynamic";
export default async function DocPage({ params }: { params: { id: string } }) {
  const doc = findDoc(params.id);
  if (!doc) notFound();
  const s = await getSession();
  return (
    <div className="space-y-4">
      <div><p className="text-xs text-slate-500">{doc.sectionTitle}{doc.group && ` / ${doc.group}`}</p><h2 className="text-lg font-bold">{doc.name}</h2></div>
      <DocumentViewer id={doc.id} type={doc.type} name={doc.name} />
      <AutosaveNotes documentId={doc.id} canEdit={!!s && can(s.role, "write")} />
    </div>
  );
}
