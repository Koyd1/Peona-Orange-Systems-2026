import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readPublicSessionIdFromRequest } from "@/lib/public-session";
import {
  getSessionById,
  getSessionRemainingMs,
  setSessionPersistent
} from "@/lib/session";

async function resolveSignedInSessionId(params: {
  request: Request;
  session: { sessionId: string; user: { email?: string | null } };
  payloadSessionId?: unknown;
}): Promise<string | null> {
  const sidFromPayload =
    typeof params.payloadSessionId === "string" ? params.payloadSessionId.trim() : "";
  const url = new URL(params.request.url);
  const sidFromQuery = url.searchParams.get("sessionId") ?? url.searchParams.get("sid") ?? "";
  const candidateId = sidFromPayload || sidFromQuery;

  if (!candidateId || candidateId === params.session.sessionId) {
    return params.session.sessionId;
  }

  const candidate = await prisma.session.findUnique({
    where: { id: candidateId },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      terminatedAt: true,
      user: { select: { email: true } }
    }
  });
  if (!candidate || candidate.terminatedAt || candidate.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  const signedInEmail = params.session.user.email?.trim().toLowerCase();
  const candidateEmail = candidate.user.email?.trim().toLowerCase();
  if (signedInEmail && candidateEmail && signedInEmail === candidateEmail) {
    return candidate.id;
  }

  const signedInSession = await prisma.session.findUnique({
    where: { id: params.session.sessionId },
    select: { userId: true }
  });
  if (signedInSession && signedInSession.userId === candidate.userId) {
    return candidate.id;
  }

  return null;
}

async function resolveSessionId(request: Request, payloadSessionId?: unknown): Promise<string | null> {
  const session = await auth();
  if (session?.sessionId) {
    return resolveSignedInSessionId({
      request,
      session: {
        sessionId: session.sessionId,
        user: {
          email: session.user.email
        }
      },
      payloadSessionId
    });
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
