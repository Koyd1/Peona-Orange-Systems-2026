import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows: Array<{
    id: string;
    messageId: string;
    comment: string | null;
    createdAt: Date;
    userId: string;
    message: {
      id: string;
      sessionId: string;
      content: string;
    };
    user: {
      id: string;
      email: string;
    };
  }> = await prisma.feedback.findMany({
    where: { rating: -1 },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      message: {
        select: {
          id: true,
          sessionId: true,
          content: true
        }
      },
      user: {
        select: {
          id: true,
          email: true
        }
      }
    }
  });

  return NextResponse.json({
    items: rows.map((row) => ({
      id: row.id,
      messageId: row.messageId,
      comment: row.comment,
      createdAt: row.createdAt.toISOString(),
      userId: row.userId,
      userEmail: row.user.email,
      sessionId: row.message.sessionId,
      messageContent: row.message.content
    }))
  });
}
