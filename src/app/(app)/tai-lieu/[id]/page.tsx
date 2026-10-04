import Link from "next/link";
import { notFound } from "next/navigation";
import { findDoc } from "@/lib/docs";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { DocumentViewer } from "@/components/DocumentViewer";
import { AutosaveNotes } from "@/components/AutosaveNotes";
export const dynamic = "force-dynamic";

export default async function DocPage({ params }: { params: { id: string } }) {
  const doc = findDoc(params.id);
  if (!doc) notFound();
  const s = await getSession();
  const canEdit = !!s && can(s.role, "write");
  const editable = doc.ext === "docx" || doc.ext === "xlsx";
  const edited = editable ? await db.docFile.findFirst({ where: { documentId: doc.id }, orderBy: { version: "desc" }, select: { version: true, createdAt: true } }).catch(() => null) : null;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1"><p className="text-xs text-slate-500">{doc.sectionTitle}{doc.group && ` / ${doc.group}`}</p><h2 className="text-lg font-bold">{doc.name}</h2></div>
        {editable && canEdit && <Link href={`/tai-lieu/${doc.id}/chinh-sua`} className="flex h-10 items-center rounded-xl bg-[#0f3b40] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-lg">{doc.ext === "docx" ? "Chỉnh sửa văn bản" : "Chỉnh sửa bảng tính"}</Link>}
      </div>
      {edited && <p className="rounded-xl bg-teal-50 px-4 py-2.5 text-sm text-teal-900">Tài liệu này có <b>bản chỉnh sửa v{edited.version}</b> (lưu lúc {edited.createdAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}). Khung xem bên dưới luôn hiển thị <b>bản gốc</b>; mở trình chỉnh sửa để xem và dùng bản đã sửa.</p>}
      <DocumentViewer id={doc.id} type={doc.type} name={doc.name} />
      <AutosaveNotes documentId={doc.id} canEdit={canEdit} />
    </div>
  );
}
