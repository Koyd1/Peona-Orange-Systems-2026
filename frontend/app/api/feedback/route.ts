import { NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
  } else if (parsed.data.sessionId) {
    const appSession = await prisma.session.findUnique({
      where: { id: parsed.data.sessionId },
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
    return NextResponse.json({ error: "Message is outside active session" }, { status: 403 });
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
