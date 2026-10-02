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
  const target = path.join(OUT, d.path.replace(/\.[^.]+$/, ".pdf"));
  if (fs.existsSync(target) && fs.statSync(target).mtimeMs >= fs.statSync(path.join(ROOT, d.path)).mtimeMs) { ok++; continue; }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  try {
    execFileSync("soffice", ["--headless", "--convert-to", "pdf", "--outdir", path.dirname(target), path.join(ROOT, d.path)], { stdio: "pipe", timeout: 120000 });
    ok++;
  } catch (e) { fail.push(d.path); }
}
console.log(`Xong ${ok}, lỗi ${fail.length}`); fail.forEach((f) => console.log("  ✗", f));
process.exit(fail.length ? 1 : 0);
