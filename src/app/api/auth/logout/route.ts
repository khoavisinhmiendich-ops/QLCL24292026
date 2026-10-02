import { NextResponse } from "next/server";
import { COOKIE, getSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
export async function POST() {
  const s = await getSession();
  if (s) await audit(s.uid, "logout");
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: COOKIE, value: "", path: "/", maxAge: 0 });
  return res;
}
