// Quét content/2429.2026 -> src/data/document-index.json (không sửa file gốc)
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve("content/2429.2026");
const OUT = path.resolve("src/data/document-index.json");
const EXT = { pdf: "pdf", doc: "word", docx: "word", xls: "excel", xlsx: "excel", csv: "excel", txt: "text", jpg: "image", jpeg: "image", png: "image" };
const roman = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };

function section(top) {
  const m = top.match(/^(\d+)\.\s*(.*)$/);
  if (m) return { kind: "chapter", order: Number(m[1]), title: m[2].trim() };
  if (/^Sổ tay/i.test(top)) return { kind: "handbook", order: 100, title: top };
  if (/^BỘ Y TẾ/i.test(top)) return { kind: "other", order: 101, title: top };
  return { kind: "other", order: 102, title: top };
}
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}
const docs = [];
for (const abs of walk(ROOT).sort((a, b) => a.localeCompare(b, "vi", { numeric: true }))) {
  const base = path.basename(abs);
  if (base.startsWith("~$") || base.startsWith(".")) continue; // file khóa tạm của Word
  const rel = path.relative(ROOT, abs).split(path.sep).join("/");
  const ext = path.extname(base).slice(1).toLowerCase();
  const st = fs.statSync(abs);
  const top = rel.split("/")[0];
  const s = section(top);
  docs.push({
    id: crypto.createHash("sha1").update(rel.normalize("NFC")).digest("hex").slice(0, 16),
    name: base,
    path: rel,
    ext,
    type: EXT[ext] ?? "other",
    size: st.size,
    modifiedAt: st.mtime.toISOString(),
    section: s.kind,
    sectionOrder: s.order,
    sectionTitle: s.title,
    group: rel.split("/").slice(1, -1).join(" / "),
  });
}
const count = (f) => docs.filter(f).length;
const index = {
  generatedAt: new Date().toISOString(),
  totals: { files: docs.length, pdf: count((d) => d.type === "pdf"), word: count((d) => d.type === "word"), excel: count((d) => d.type === "excel"), image: count((d) => d.type === "image") },
  documents: docs,
};
fs.writeFileSync(OUT, JSON.stringify(index, null, 1));
console.log("Index:", index.totals);
