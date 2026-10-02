// ADMIN_USERNAME=... ADMIN_PASSKEY=... npm run seed:admin  (cần DATABASE_URL)
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const { ADMIN_USERNAME: u, ADMIN_PASSKEY: p } = process.env;
if (!u || !p || p.length < 10) { console.error("Cần ADMIN_USERNAME và ADMIN_PASSKEY (>= 10 ký tự)"); process.exit(1); }
const db = new PrismaClient();
const passkeyHash = await bcrypt.hash(p, 12);
await db.user.upsert({ where: { username: u.toLowerCase() }, update: { passkeyHash, role: "ADMIN", active: true }, create: { username: u.toLowerCase(), displayName: u, passkeyHash, role: "ADMIN" } });
console.log("Đã tạo/cập nhật ADMIN:", u.toLowerCase());
await db.$disconnect();
