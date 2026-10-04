# Chạy MỘT LẦN trong thư mục dự án: cài thư viện -> cập nhật database -> kiểm tra -> build -> đẩy lên GitHub (Vercel tự deploy)
$ErrorActionPreference = "Stop"
function Step($t) { Write-Host "`n=== $t ===" -ForegroundColor Cyan }
function Check($what) { if ($LASTEXITCODE -ne 0) { Write-Host "`n[LỖI] $what. Dừng lại - hãy chụp màn hình dòng lỗi gửi cho trợ lý." -ForegroundColor Red; exit 1 } }

if (-not (Test-Path ".env")) { if (Test-Path ".env.local") { Copy-Item ".env.local" ".env"; Write-Host "Đã tạo .env từ .env.local" } else { Write-Host "[LỖI] Thiếu file .env.local (DATABASE_URL, AUTH_SECRET, BLOB_READ_WRITE_TOKEN)" -ForegroundColor Red; exit 1 } }

Step "1/5 Cài thư viện (exceljs, jszip, docx-preview...)"
npm install; Check "npm install"

Step "2/5 Cập nhật database (chỉ THÊM bảng mới, không xóa dữ liệu hiện có)"
npx prisma db push; Check "prisma db push"

Step "3/5 Kiểm tra TypeScript"
npm run typecheck; Check "typecheck"

Step "4/5 Build bản production"
npm run build; Check "build"

Step "5/5 Đẩy lên GitHub (Vercel tự động deploy)"
git add .
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) { git commit -m "Word/Excel editor, AI, tìm kiếm, người dùng, sao lưu tự động, phiên bản"; Check "git commit" }
git push; Check "git push"

Write-Host "`nHOÀN TẤT. Mở Vercel > Deployments để xem bản mới. Nhớ thêm CRON_SECRET (và AI_API_KEY) vào Environment Variables nếu chưa có." -ForegroundColor Green
