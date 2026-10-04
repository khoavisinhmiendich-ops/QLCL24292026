// Truy hồi nội dung tài liệu 2429.2026 (BM25 trên chỉ mục văn bản đã trích xuất). Chỉ dùng phía máy chủ.
import data from "@/server-data/content-index.json";

export type RagDoc = { id: string; name: string; section: string; order: number; group: string };
export type Hit = { doc: RagDoc; page: number; text: string; score: number };

const DOCS = (data as unknown as { docs: RagDoc[] }).docs;
const CHUNKS = (data as unknown as { chunks: [number, number, string][] }).chunks;

export const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
const STOP = new Set(["la", "cua", "va", "cac", "nhung", "co", "khong", "duoc", "trong", "cho", "mot", "de", "voi", "the", "nao", "gi", "nhu", "khi", "tu", "den", "theo", "ve", "bao", "nhieu", "hay", "hoac", "thi", "ma", "do", "nay", "no", "ra", "vao", "se", "da", "dang", "can", "phai", "tai", "lieu", "cho", "toi", "ban", "hay", "xin", "vui", "long"]);
const tokenize = (s: string) => norm(s).split(/[^a-z0-9]+/).filter((t) => t.length > 1 && !STOP.has(t));

type Built = { post: Map<string, [number, number][]>; len: number[]; avg: number };
let built: Built | null = null;
function build(): Built {
  if (built) return built;
  const post = new Map<string, [number, number][]>();
  const len: number[] = [];
  CHUNKS.forEach((c, i) => {
    const toks = tokenize(c[2]);
    len.push(toks.length || 1);
    const tf = new Map<string, number>();
    toks.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
    tf.forEach((n, t) => { const l = post.get(t); if (l) l.push([i, n]); else post.set(t, [[i, n]]); });
  });
  built = { post, len, avg: len.reduce((a, b) => a + b, 0) / Math.max(1, len.length) };
  return built;
}

/** Tìm các đoạn liên quan nhất; mỗi tài liệu tối đa perDoc đoạn. */
export function search(query: string, k = 8, perDoc = 2): Hit[] {
  const b = build();
  const terms = Array.from(new Set(tokenize(query)));
  if (!terms.length) return [];
  const N = CHUNKS.length, k1 = 1.4, bb = 0.75;
  const score = new Map<number, number>();
  for (const t of terms) {
    const l = b.post.get(t);
    if (!l) continue;
    const idf = Math.log(1 + (N - l.length + 0.5) / (l.length + 0.5));
    for (const [i, tf] of l) score.set(i, (score.get(i) ?? 0) + idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - bb + (bb * b.len[i]) / b.avg))));
  }
  const nq = norm(query).replace(/\s+/g, " ").trim();
  const cands = Array.from(score.entries()).sort((x, y) => y[1] - x[1]).slice(0, 80).map(([i, s]) => {
    const bonus = nq.length > 6 && norm(CHUNKS[i][2]).includes(nq) ? 4 : 0;
    return { i, s: s + bonus };
  }).sort((x, y) => y.s - x.s);
  const used = new Map<number, number>();
  const seen = new Set<string>();
  const out: Hit[] = [];
  for (const { i, s } of cands) {
    const [di, page, text] = CHUNKS[i];
    const twin = `${DOCS[di].name.replace(/\.[^.]+$/, "")}|${page}|${text.slice(0, 60)}`; // bản .docx và .pdf cùng nội dung chỉ lấy một
    if (seen.has(twin)) continue;
    seen.add(twin);
    if ((used.get(di) ?? 0) >= perDoc) continue;
    used.set(di, (used.get(di) ?? 0) + 1);
    out.push({ doc: DOCS[di], page, text, score: s });
    if (out.length >= k) break;
  }
  return out;
}

/** Trích đoạn ngắn quanh từ khóa đầu tiên khớp (giữ nguyên dấu tiếng Việt của văn bản gốc). */
export function snippet(text: string, query: string, width = 220) {
  let plain = ""; const map: number[] = [];
  for (let i = 0; i < text.length; i++) { const n = norm(text[i]); for (let j = 0; j < n.length; j++) { plain += n[j]; map.push(i); } }
  let pos = -1;
  for (const t of tokenize(query)) { const p = plain.indexOf(t); if (p >= 0 && (pos < 0 || p < pos)) pos = p; }
  const start = Math.max(0, (pos < 0 ? 0 : map[pos]) - 60);
  const s = text.slice(start, start + width).replace(/\s+/g, " ").trim();
  return (start > 0 ? "… " : "") + s + (start + width < text.length ? " …" : "");
}
export const sectionLabel = (d: RagDoc) => (d.section === "chapter" ? `Chương ${d.order}` : d.section === "handbook" ? "Sổ tay" : "Tài liệu khác");
