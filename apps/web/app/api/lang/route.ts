/** POST /api/lang, mémorise la langue de l'app dans un cookie (1 an). */
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { lang } = await request.json().catch(() => ({}));
  const value = lang === "en" ? "en" : "fr";
  const res = NextResponse.json({ ok: true, lang: value });
  res.cookies.set("lang", value, { path: "/", maxAge: 31_536_000, sameSite: "lax" });
  return res;
}
