import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { terminateSession } from "@/lib/session";

async function resolveSessionId(request: Request, payloadSessionId?: unknown): Promise<string | null> {
  const session = await auth();
  if (session?.sessionId) {
    return session.sessionId;
  }

  const sidFromPayload =
    typeof payloadSessionId === "string" ? payloadSessionId.trim() : "";
  const url = new URL(request.url);
  const sidFromQuery =
    url.searchParams.get("sessionId") ?? url.searchParams.get("sid") ?? "";

  const sessionId = sidFromPayload || sidFromQuery;
  return sessionId || null;
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { sessionId?: string } | null;
  const sessionId = await resolveSessionId(request, payload?.sessionId);

  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await terminateSession(sessionId);
  return NextResponse.json({ ok: true });
}
