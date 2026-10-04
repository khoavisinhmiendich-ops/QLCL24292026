// npm run previews — chuyển Word/Excel -> PDF (LibreOffice) vào previews/ để xem đúng bố cục gốc. Không sửa file gốc.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const ROOT = path.resolve("content/2429.2026"), OUT = path.resolve("previews");
const index = JSON.parse(fs.readFileSync("src/data/document-index.json", "utf8"));
const only = process.argv[2]; // tùy chọn: lọc theo chuỗi trong đường dẫn
let ok = 0, fail = [];
for (const d of index.documents.filter((x) => x.type === "word" || x.type === "excel")) {
  if (only && !d.path.includes(only)) continue;
  const target = path.join(OUT, `${d.path}.pdf`); // giữ đuôi gốc để .docx và .xlsx cùng tên không đè nhau
  if (fs.existsSync(target) && fs.statSync(target).mtimeMs >= fs.statSync(path.join(ROOT, d.path)).mtimeMs) { ok++; continue; }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  try {
    const tmp = fs.mkdtempSync(path.join(OUT, ".tmp-"));
    execFileSync("soffice", ["--headless", "--convert-to", "pdf", "--outdir", tmp, path.join(ROOT, d.path)], { stdio: "pipe", timeout: 180000 });
    const out = fs.readdirSync(tmp).find((f) => f.endsWith(".pdf"));
    if (!out) throw new Error("no output");
    fs.renameSync(path.join(tmp, out), target); fs.rmSync(tmp, { recursive: true, force: true });
    ok++;
  } catch (e) { fail.push(d.path); }
}
console.log(`Xong ${ok}, lỗi ${fail.length}`); fail.forEach((f) => console.log("  ✗", f));
process.exit(fail.length ? 1 : 0);
