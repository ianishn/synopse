import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // 303 See Other : force le navigateur à faire un GET (sinon il re-POST → 405).
  return NextResponse.redirect(new URL("/deconnexion", request.url), { status: 303 });
}
