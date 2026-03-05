import { NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const bodySchema = z.object({
  messageId: z.string().min(8),
  rating: z.union([z.literal(1), z.literal(-1)]),
  comment: z.string().trim().max(600).optional().or(z.literal(""))
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

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

  const message = await prisma.message.findUnique({
    where: { id: parsed.data.messageId },
    select: { id: true, role: true }
  });

  if (!message || message.role !== "assistant") {
    return NextResponse.json({ error: "Assistant message not found" }, { status: 404 });
  }

  try {
    await prisma.feedback.create({
      data: {
        messageId: parsed.data.messageId,
        userId: user.id,
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
