/** GET /api/agent/config — règles compilées, 304 si If-None-Match inchangé. */
import { NextResponse } from "next/server";
import { authAgent } from "@/lib/agent-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { computeConfig } from "@/lib/compile-config";

export async function GET(request: Request) {
  const agent = await authAgent(request);
  if (!agent) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const config = await computeConfig(createServiceClient(), agent);
  if (request.headers.get("if-none-match") === config.etag) {
    return new NextResponse(null, { status: 304 });
  }
  return NextResponse.json(config, { headers: { etag: config.etag } });
}
