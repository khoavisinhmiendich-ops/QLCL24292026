import index from "@/data/document-index.json";
export type Doc = { id: string; name: string; path: string; ext: string; type: string; size: number; modifiedAt: string; section: string; sectionOrder: number; sectionTitle: string; group: string };
export const allDocs = index.documents as Doc[];
export const totals = index.totals;
export const chapters = Array.from(new Map(allDocs.filter((d) => d.section === "chapter").map((d) => [d.sectionOrder, d.sectionTitle])).entries())
  .sort((a, b) => a[0] - b[0]).map(([n, title]) => ({ n, title }));
export const bySection = (kind: string, order?: number) => allDocs.filter((d) => d.section === kind && (order === undefined || d.sectionOrder === order));
export const findDoc = (id: string) => allDocs.find((d) => d.id === id);
export const fmtSize = (b: number) => (b > 1e6 ? (b / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1e3)) + " KB");

// ---- Phân nhóm bên dưới chương: SOP / Quy trình · Biểu mẫu · PDF · Tài liệu ----
export type CategoryKey = "sop" | "bm" | "pdf" | "other";
export const CATEGORY_LABEL: Record<CategoryKey, string> = { sop: "SOP / Quy trình", bm: "Biểu mẫu", pdf: "PDF", other: "Tài liệu" };
const CATEGORY_ORDER: CategoryKey[] = ["sop", "bm", "pdf", "other"];
/** Các chương hiển thị theo nhóm. Muốn áp dụng cho chương khác, thêm số chương vào đây. */
export const GROUPED_CHAPTERS = new Set<number>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

export function categoryOf(d: Doc): CategoryKey {
  if (d.type === "pdf") return "pdf";
  if (/QTQL|quy trình/i.test(d.name)) return "sop";
  if (/\bBM\b/.test(d.name)) return "bm";
  return "other";
}
export function categorize(docs: Doc[]) {
  return CATEGORY_ORDER.map((key) => ({ key, label: CATEGORY_LABEL[key], docs: docs.filter((d) => categoryOf(d) === key) })).filter((g) => g.docs.length > 0);
}

/** Hiển thị tên chương gọn hơn: bỏ tiền tố "CHƯƠNG X." và viết hoa chữ đầu câu (chỉ đổi cách hiển thị, tên gốc giữ nguyên trong dữ liệu). */
export function shortTitle(t: string) {
  const s = t.replace(/^\s*ch[uư]ơng\s+[IVX]+\.?\s*/i, "").trim();
  const low = s.toLocaleLowerCase("vi-VN");
  return low.charAt(0).toLocaleUpperCase("vi-VN") + low.slice(1);
}
