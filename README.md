# Quản lý chất lượng 2429.2026

Next.js 14 (App Router) + TypeScript + Tailwind + Prisma (Postgres/Neon) + Vercel Blob. Source code ở GitHub, **dữ liệu người dùng ở database cloud** (tách hẳn khỏi source).

## Nội dung gốc
`content/2429.2026/` là nguồn tài liệu chính thức (343 file). Không sửa file trong thư mục này.
Đã áp dụng: thư mục "9. CHƯƠNG XI. QUẢN LÝ THÔNG TIN" đổi thành "9. CHƯƠNG IX. ..." (nội dung file giữ nguyên); Chương 11 giữ nguyên; file khóa Word `~$-BM 5.5.1.01...` đã loại, dùng file gốc `XN-BM 5.5.1.01 Danh mục thiết bị.docx`.

## Chạy lần đầu
```bash
npm install
cp .env.example .env.local        # điền DATABASE_URL, AUTH_SECRET, BLOB_READ_WRITE_TOKEN
npm run db:push                   # tạo bảng
ADMIN_USERNAME=admin ADMIN_PASSKEY='<pass key mạnh>' npm run seed:admin
npm run index && npm run audit:documents
npm run previews                  # Word/Excel -> PDF xem trước (cần LibreOffice)
npm run upload:docs               # đưa file + preview lên Vercel Blob, ghi metadata vào DB
npm run dev
```
Kiểm tra trước khi deploy: `npm run lint && npm run typecheck && npm run build`.

## GitHub + Vercel
```bash
git remote add origin https://github.com/<tai-khoan>/qlcl-2429-2026.git
git push -u origin main develop
```
Vercel: Import repo → Environment Variables (Development/Preview/Production): `DATABASE_URL`, `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`, `AI_API_KEY`. Build command mặc định (`npm run build`).
Không commit `.env*`. Mọi dữ liệu nhập nằm trong DB nên deploy/sửa code không làm mất dữ liệu; chỉ chạy `db:push` khi đổi schema và không dùng `--force-reset`.

## Chưa làm (giai đoạn sau)
Word editor, Excel editor, xuất Word/Excel/PDF từ dữ liệu nhập, Print Preview, AI + RAG + tìm Internet, Global Search, quản lý người dùng/phân quyền trên giao diện.
