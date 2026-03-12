import { NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readPublicSessionIdFromRequest } from "@/lib/public-session";

const bodySchema = z.object({
  sessionId: z.string().min(8).optional(),
  messageId: z.string().min(8),
  rating: z.union([z.literal(1), z.literal(-1)]),
  comment: z.string().trim().max(600).optional().or(z.literal(""))
});

export async function POST(request: Request) {
  const session = await auth();

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  let userId: string | null = null;
  let allowedSessionId: string | undefined;

  if (session) {
    const email = session.user.email ?? "unknown@hr.local";
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: session.user.role },
      create: {
        email,
        role: session.user.role,
        passwordHash: "__managed_by_nextauth__"
      }
    });
    userId = user.id;
    allowedSessionId = session.sessionId;
  } else {
    const publicSessionId = readPublicSessionIdFromRequest(request);
    if (!publicSessionId) {
      return new Response("Unauthorized", { status: 401 });
    }
    if (parsed.data.sessionId && parsed.data.sessionId !== publicSessionId) {
      return NextResponse.json({ error: "Session mismatch" }, { status: 403 });
    }

    const appSession = await prisma.session.findUnique({
      where: { id: publicSessionId },
      select: { id: true, userId: true, expiresAt: true, terminatedAt: true }
    });

    if (!appSession || appSession.terminatedAt || appSession.expiresAt.getTime() <= Date.now()) {
      return new Response("Unauthorized", { status: 401 });
    }

    userId = appSession.userId;
    allowedSessionId = appSession.id;
  }

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const message = await prisma.message.findUnique({
    where: { id: parsed.data.messageId },
    select: { id: true, role: true, sessionId: true }
  });

  if (!message || message.role !== "assistant") {
    return NextResponse.json({ error: "Assistant message not found" }, { status: 404 });
  }

  if (allowedSessionId && message.sessionId !== allowedSessionId) {
    /* Signed-in user whose JWT sessionId is stale (after "Новый чат").
       Accept the body sessionId if it matches the message and belongs
       to the same user. */
    const bodySid = parsed.data.sessionId;
    let accepted = false;

    if (session && bodySid && bodySid === message.sessionId) {
      const [oldRow, newRow] = await Promise.all([
        prisma.session.findUnique({ where: { id: allowedSessionId }, select: { userId: true } }),
        prisma.session.findUnique({
          where: { id: bodySid },
          select: { userId: true, terminatedAt: true, expiresAt: true }
        })
      ]);
      if (
        oldRow &&
        newRow &&
        !newRow.terminatedAt &&
        newRow.expiresAt.getTime() > Date.now() &&
        newRow.userId === oldRow.userId
      ) {
        accepted = true;
      }
    }

    if (!accepted) {
      return NextResponse.json({ error: "Message is outside active session" }, { status: 403 });
    }
  }

  try {
    await prisma.feedback.create({
      data: {
        messageId: parsed.data.messageId,
        userId,
        rating: parsed.data.rating,
        comment: parsed.data.comment || null
      }
    });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Feedback already exists" }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({ ok: true });
}
