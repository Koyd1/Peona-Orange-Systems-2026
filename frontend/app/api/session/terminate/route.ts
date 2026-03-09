import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { readPublicSessionIdFromRequest } from "@/lib/public-session";
import { sessionHasMessages, terminateSession } from "@/lib/session";

async function resolveSessionId(request: Request, payloadSessionId?: unknown): Promise<string | null> {
  const session = await auth();
  if (session?.sessionId) {
    return session.sessionId;
  }

  const publicSessionId = readPublicSessionIdFromRequest(request);
  if (!publicSessionId) {
    return null;
  }

  const sidFromPayload = typeof payloadSessionId === "string" ? payloadSessionId.trim() : "";
  const url = new URL(request.url);
  const sidFromQuery = url.searchParams.get("sessionId") ?? url.searchParams.get("sid") ?? "";
  if (
    (sidFromPayload && sidFromPayload !== publicSessionId) ||
    (sidFromQuery && sidFromQuery !== publicSessionId)
  ) {
    return null;
  }

  return publicSessionId;
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { sessionId?: string } | null;
  const sessionId = await resolveSessionId(request, payload?.sessionId);

  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasMessages = await sessionHasMessages(sessionId);
  if (!hasMessages) {
    return NextResponse.json(
      { error: "Отправьте хотя бы одно сообщение перед завершением сессии" },
      { status: 400 }
    );
  }

  await terminateSession(sessionId);
  return NextResponse.json({ ok: true });
}
