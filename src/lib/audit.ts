import { headers } from "next/headers";
import { db } from "./db";
export async function audit(userId: string | null, action: string, target?: string, meta?: object) {
  try {
    const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    await db.auditLog.create({ data: { userId, action, target, meta: meta as object | undefined, ip } });
  } catch (e) { console.error("audit failed", e); }
}
