// Không có cách xem lại pass key cũ (hệ thống chỉ lưu bản băm). Script này đặt pass key MỚI và mở khóa đăng nhập.
//
// 1) Xem danh sách tài khoản:
//      node --env-file=.env scripts/reset-passkey.mjs
// 2) Đặt pass key mới cho một tài khoản:
//      $env:RESET_USER="admin"; $env:RESET_PASSKEY="pass-key-moi-cua-ban"
//      node --env-file=.env scripts/reset-passkey.mjs
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const user = process.env.RESET_USER?.toLowerCase();
const passkey = process.env.RESET_PASSKEY;

try {
  if (!user || !passkey) {
    const users = await db.user.findMany({ select: { username: true, role: true, active: true }, orderBy: { createdAt: "asc" } });
    console.log("Tài khoản hiện có:");
    users.forEach((u) => console.log(`  - ${u.username}  (${u.role}${u.active ? "" : ", đã khóa"})`));
    console.log("\nĐể đặt lại, đặt RESET_USER và RESET_PASSKEY rồi chạy lại lệnh này.");
  } else {
    if (passkey.length < 10) throw new Error("Pass key mới phải có ít nhất 10 ký tự.");
    const found = await db.user.findUnique({ where: { username: user } });
    if (!found) throw new Error(`Không có tài khoản "${user}". Chạy lệnh không tham số để xem danh sách.`);
    await db.user.update({ where: { id: found.id }, data: { passkeyHash: await bcrypt.hash(passkey, 12), active: true } });
    const cleared = await db.loginAttempt.deleteMany({ where: { key: user } });
    await db.auditLog.create({ data: { userId: found.id, action: "passkey_reset", target: user } });
    console.log(`✓ Đã đặt pass key mới cho "${user}" và mở khóa đăng nhập (xóa ${cleared.count} lần thử sai).`);
  }
} catch (e) {
  console.error("Lỗi:", e.message);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
