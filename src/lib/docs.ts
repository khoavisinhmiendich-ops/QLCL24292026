import index from "@/data/document-index.json";
export type Doc = { id: string; name: string; path: string; ext: string; type: string; size: number; modifiedAt: string; section: string; sectionOrder: number; sectionTitle: string; group: string };
export const allDocs = index.documents as Doc[];
export const totals = index.totals;
export const chapters = Array.from(new Map(allDocs.filter((d) => d.section === "chapter").map((d) => [d.sectionOrder, d.sectionTitle])).entries())
  .sort((a, b) => a[0] - b[0]).map(([n, title]) => ({ n, title }));
export const bySection = (kind: string, order?: number) => allDocs.filter((d) => d.section === kind && (order === undefined || d.sectionOrder === order));
export const findDoc = (id: string) => allDocs.find((d) => d.id === id);
export const fmtSize = (b: number) => (b > 1e6 ? (b / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1e3)) + " KB");
