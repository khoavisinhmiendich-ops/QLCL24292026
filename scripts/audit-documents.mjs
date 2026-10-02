// npm run audit:documents — kiểm tra thiếu/hỏng/trùng/định dạng. Thoát mã 1 nếu có lỗi.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve("content/2429.2026");
const index = JSON.parse(fs.readFileSync("src/data/document-index.json", "utf8"));
const problems = [], warnings = [];
const seen = new Map();
const onDisk = new Set();
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p) : onDisk.add(path.relative(ROOT, p).split(path.sep).join("/")); } })(ROOT);

for (const d of index.documents) {
  const abs = path.join(ROOT, d.path);
  if (!fs.existsSync(abs)) { problems.push(`THIẾU: ${d.path}`); continue; }
  const buf = fs.readFileSync(abs);
  if (buf.length === 0) problems.push(`RỖNG: ${d.path}`);
  if (d.path !== d.path.normalize("NFC")) warnings.push(`Tên chưa chuẩn NFC: ${d.path}`);
  if (/#U[0-9a-f]{4}/i.test(d.path)) problems.push(`Tên còn mã escape: ${d.path}`);
  if (d.ext === "pdf" && buf.subarray(0, 5).toString() !== "%PDF-") problems.push(`PDF HỎNG: ${d.path}`);
  if (["docx", "xlsx"].includes(d.ext)) {
    const isOle = buf.subarray(0, 4).toString("hex") === "d0cf11e0"; // định dạng .doc/.xls cũ bị đổi đuôi
    if (isOle) warnings.push(`ĐỊNH DẠNG CŨ (.${d.ext === "docx" ? "doc" : "xls"} đổi đuôi ${d.ext}), vẫn xem được qua LibreOffice: ${d.path}`);
    else if (buf[0] !== 0x50 || buf[1] !== 0x4b) problems.push(`${d.ext.toUpperCase()} HỎNG (không phải zip OOXML): ${d.path}`);
    else { try { execFileSync("unzip", ["-tq", abs], { stdio: "pipe" }); } catch { problems.push(`${d.ext.toUpperCase()} HỎNG (unzip lỗi): ${d.path}`); } }
  }
  const h = crypto.createHash("md5").update(buf).digest("hex");
  if (seen.has(h)) warnings.push(`TRÙNG NỘI DUNG: ${d.path} == ${seen.get(h)}`); else seen.set(h, d.path);
}
const indexed = new Set(index.documents.map((d) => d.path));
for (const p of onDisk) if (!indexed.has(p)) (path.basename(p).startsWith("~$") ? problems : warnings).push(`${path.basename(p).startsWith("~$") ? "FILE KHÓA TẠM CỦA WORD (nên xóa)" : "CHƯA CÓ TRONG INDEX (chạy npm run index)"}: ${p}`);
console.log(`Đã kiểm tra ${index.documents.length} file — ${index.totals.pdf} PDF, ${index.totals.word} Word, ${index.totals.excel} Excel, ${index.totals.image} ảnh`);
warnings.forEach((w) => console.log("  ⚠", w));
problems.forEach((p) => console.log("  ✗", p));
console.log(problems.length ? `\nCÓ ${problems.length} LỖI` : "\n✓ Không có lỗi");
process.exit(problems.length ? 1 : 0);
