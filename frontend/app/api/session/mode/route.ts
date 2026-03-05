import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  getSessionById,
  getSessionRemainingMs,
  setSessionPersistent
} from "@/lib/session";

export async function GET() {
  const session = await auth();

  if (!session?.sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appSession = getSessionById(session.sessionId);
  if (!appSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({
    persistent: appSession.persistent,
    expiresAt: appSession.expiresAt.toISOString(),
    remainingMs: getSessionRemainingMs(appSession.id)
  });
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as { persistent?: boolean } | null;
  if (!payload || typeof payload.persistent !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updated = setSessionPersistent(session.sessionId, payload.persistent);
  if (!updated) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    persistent: updated.persistent,
    expiresAt: updated.expiresAt.toISOString(),
    remainingMs: getSessionRemainingMs(updated.id)
  });
}
