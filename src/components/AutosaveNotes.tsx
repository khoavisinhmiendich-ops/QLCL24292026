"use client";
import { useAutosave } from "@/hooks/useAutosave";
/** Ghi chú/biểu mẫu nhập liệu gắn với một tài liệu; tự lưu vào database. */
export function AutosaveNotes({ documentId, canEdit }: { documentId: string; canEdit: boolean }) {
  const { data, update, loaded, retry } = useAutosave<{ note: string }>("doc-notes", documentId, { note: "" });
  if (!loaded) return <p className="text-sm text-slate-500">Đang tải...</p>;
  return (
    <section className="rounded-lg border bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold">Ghi chú / dữ liệu nhập</h3>
      <textarea aria-label="Ghi chú" readOnly={!canEdit} value={data.note} onChange={(e) => update({ note: e.target.value })} rows={5} className="w-full rounded border p-2 text-sm" placeholder={canEdit ? "Nhập nội dung, hệ thống tự động lưu..." : "Bạn chỉ có quyền xem"} />
      <button onClick={retry} className="mt-2 text-xs text-brand-600 underline">Lưu lại ngay</button>
    </section>
  );
}
