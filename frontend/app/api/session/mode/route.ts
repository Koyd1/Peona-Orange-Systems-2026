import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  getSessionById,
  getSessionRemainingMs,
  setSessionPersistent
} from "@/lib/session";

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

export async function GET(request: Request) {
  const sessionId = await resolveSessionId(request);

  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appSession = await getSessionById(sessionId);
  if (!appSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({
    persistent: appSession.persistent,
    expiresAt: appSession.expiresAt.toISOString(),
    remainingMs: await getSessionRemainingMs(appSession.id)
  });
}

export async function PATCH(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | { persistent?: boolean; sessionId?: string }
    | null;
  if (!payload || typeof payload.persistent !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const sessionId = await resolveSessionId(request, payload.sessionId);
  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updated = await setSessionPersistent(sessionId, payload.persistent);
  if (!updated) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    persistent: updated.persistent,
    expiresAt: updated.expiresAt.toISOString(),
    remainingMs: await getSessionRemainingMs(updated.id)
  });
}
