import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readPublicSessionIdFromRequest } from "@/lib/public-session";
import { sessionHasMessages, terminateSession } from "@/lib/session";

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
