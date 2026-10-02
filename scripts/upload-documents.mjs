// npm run upload:docs — đưa file gốc + bản PDF xem trước lên Vercel Blob và ghi metadata vào DB.
// Cần DATABASE_URL, BLOB_READ_WRITE_TOKEN. Chạy lại an toàn (cập nhật theo id).
import fs from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const ROOT = path.resolve("content/2429.2026"), PREV = path.resolve("previews");
const index = JSON.parse(fs.readFileSync("src/data/document-index.json", "utf8"));
const up = async (key, file, type) => (await put(key, fs.readFileSync(file), { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: type })).url;
for (const d of index.documents) {
  const blobUrl = await up(`2429.2026/${d.path}`, path.join(ROOT, d.path));
  const pv = path.join(PREV, d.path.replace(/\.[^.]+$/, ".pdf"));
  const previewUrl = d.type === "word" || d.type === "excel" ? (fs.existsSync(pv) ? await up(`previews/${d.path.replace(/\.[^.]+$/, ".pdf")}`, pv, "application/pdf") : null) : null;
  const data = { path: d.path, name: d.name, ext: d.ext, type: d.type, size: d.size, section: d.section, sectionOrder: d.sectionOrder, blobUrl, previewUrl };
  await db.document.upsert({ where: { id: d.id }, update: data, create: { id: d.id, ...data } });
  console.log("✓", d.path);
}
await db.$disconnect();
