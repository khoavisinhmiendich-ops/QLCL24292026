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

## Đã có
- Xem tài liệu gốc (PDF; Word/Excel qua bản PDF), phân nhóm SOP / Biểu mẫu / PDF / Tài liệu cho 12 chương, Sổ tay, Tài liệu khác.
- Đăng nhập pass key (bcrypt, cookie HTTP-only, khóa tạm khi sai nhiều lần), 4 vai trò, màn hình quản lý người dùng.
- Trình soạn thảo Word: sửa trực tiếp trong file .docx (giữ nguyên bố cục, bảng, hình, đầu/chân trang), định dạng, tìm/thay thế, hoàn tác/làm lại, xem trước trang in, in/Lưu PDF, xuất .docx.
- Trình soạn thảo Excel: nhiều sheet, nhập trực tiếp, công thức, gộp ô, chèn/xóa dòng/cột, đổi cỡ cột, sắp xếp, lọc, cố định dòng/cột, định dạng, sao chép/dán, hoàn tác, nhập .xlsx, xuất .xlsx, in/Lưu PDF.
- Mỗi lần lưu file Word/Excel là một phiên bản (giữ 30 bản gần nhất), có lịch sử và khôi phục; bản gốc không bao giờ bị thay đổi. Ghi chú nhập liệu cũng có lịch sử phiên bản.
- Tự lưu, sao lưu thủ công và sao lưu tự động hằng ngày (Vercel Cron, 03:00 giờ VN), khôi phục, nhật ký hoạt động.
- Tìm kiếm theo tên và nội dung; AI Assistant (RAG trên 340 tài liệu + tùy chọn tra cứu Internet).
- Menu trượt cho điện thoại, trang lỗi/404.

## Biến môi trường (Vercel + .env.local)
`DATABASE_URL`, `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET` (sao lưu tự động), `AI_API_KEY` và tùy chọn `AI_MODEL` (AI Assistant).

## Cập nhật một lần
Giải nén bản mới vào thư mục dự án rồi chạy `powershell -ExecutionPolicy Bypass -File .\cap-nhat.ps1`.

## Giới hạn đã biết
- File Word/Excel đời cũ (.doc/.xls đổi đuôi) xem được nhưng không mở được trong trình chỉnh sửa (có 2 file).
- Excel: biểu đồ/hình vẽ có thể không được giữ khi lưu bản chỉnh sửa (1 file có biểu đồ). Word: chưa chèn ảnh/bảng mới, chưa tạo danh sách đánh số.
- File chỉnh sửa tối đa 4 MB khi lưu trực tuyến (các file hiện có đều dưới 1,4 MB).
- File QUYẾT ĐỊNH SỐ 2429 của Bộ Y tế là ảnh quét 1 trang nên chưa tìm được chữ bên trong.
