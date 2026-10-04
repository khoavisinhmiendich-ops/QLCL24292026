import { notFound, redirect } from "next/navigation";
import { findDoc } from "@/lib/docs";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { EditorLoader } from "@/components/editors/EditorLoader";
export const dynamic = "force-dynamic";

export default async function EditPage({ params }: { params: { id: string } }) {
  const doc = findDoc(params.id);
  if (!doc || (doc.ext !== "docx" && doc.ext !== "xlsx")) notFound();
  const s = await getSession();
  if (!s || !can(s.role, "write")) redirect(`/tai-lieu/${doc.id}`);
  return <EditorLoader kind={doc.ext === "docx" ? "word" : "excel"} docId={doc.id} name={doc.name} docHref={`/tai-lieu/${doc.id}`} />;
}
