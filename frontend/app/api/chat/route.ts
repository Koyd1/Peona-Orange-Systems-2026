import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type InputMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type DoneEventPayload = {
  answer?: string;
  session_id?: string;
  hallScore?: number;
};

type SourcePayload = {
  fileId?: string;
  filename?: string;
  similarity?: number;
  snippet?: string;
};

function backendUrl(path: string): string {
  const base = process.env.PYTHON_BACKEND_URL ?? "http://backend:8000";
  return `${base}${path}`;
}

async function ensureUserAndSession(params: {
  email: string;
  role: "ADMIN" | "USER";
  sessionId: string;
}) {
  const user = await prisma.user.upsert({
    where: { email: params.email },
    update: { role: params.role },
    create: {
      email: params.email,
      passwordHash: "__managed_by_nextauth__",
      role: params.role
    }
  });

  await prisma.session.upsert({
    where: { id: params.sessionId },
    update: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
      persistent: true
    },
    create: {
      id: params.sessionId,
      userId: user.id,
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
      persistent: true
    }
  });

  return user;
}

async function persistDoneFromSSE(
  stream: ReadableStream<Uint8Array>,
  ctx: {
    sessionId: string;
    userMessage: string;
    email: string;
    role: "ADMIN" | "USER";
  }
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sources: SourcePayload[] = [];

  try {
    await ensureUserAndSession({
      email: ctx.email,
      role: ctx.role,
      sessionId: ctx.sessionId
    });

    await prisma.message.create({
      data: {
        sessionId: ctx.sessionId,
        role: "user",
        content: ctx.userMessage
      }
    });

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const chunk = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        const dataLine = chunk
          .split("\n")
          .find((line) => line.startsWith("data: "));

        if (dataLine) {
          const raw = dataLine.slice(6);
          const event = JSON.parse(raw) as { type?: string; data?: unknown };

          if (event.type === "sources" && Array.isArray(event.data)) {
            sources = event.data as SourcePayload[];
          }

          if (event.type === "done") {
            const data = (event.data ?? {}) as DoneEventPayload;
            const answer = typeof data.answer === "string" ? data.answer : "";
            const hallScore =
              typeof data.hallScore === "number" && Number.isFinite(data.hallScore)
                ? data.hallScore
                : null;

            await prisma.message.create({
              data: {
                sessionId: ctx.sessionId,
                role: "assistant",
                content: answer,
                sources,
                hallScore
              }
            });

            return;
          }
        }

        boundary = buffer.indexOf("\n\n");
      }
    }
  } catch {
    return;
  } finally {
    reader.releaseLock();
  }
}

export async function GET() {
  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!session.sessionId) {
    return NextResponse.json({ items: [] });
  }

  const rows = await prisma.message.findMany({
    where: { sessionId: session.sessionId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
      sources: true,
      createdAt: true
    }
  });

  return NextResponse.json({
    items: rows.map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      sources: row.sources,
      createdAt: row.createdAt.toISOString()
    }))
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!session.sessionId) {
    return NextResponse.json({ error: "Session is not active" }, { status: 401 });
  }

  const payload = (await request.json()) as {
    messages?: InputMessage[];
    sessionId?: string;
  };

  const messages = payload.messages ?? [];
  const lastUserMessage = [...messages].reverse().find((msg) => msg.role === "user")?.content ?? "";

  const upstream = await fetch(backendUrl("/api/v1/chat"), {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      session_id: payload.sessionId ?? session.sessionId,
      messages
    })
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text();
    return new Response(text || "Chat backend error", { status: upstream.status || 500 });
  }

  const [clientStream, auditStream] = upstream.body.tee();

  void persistDoneFromSSE(auditStream, {
    sessionId: payload.sessionId ?? session.sessionId,
    userMessage: lastUserMessage,
    email: session.user.email ?? "unknown@hr.local",
    role: session.user.role
  });

  return new Response(clientStream, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive"
    }
  });
}
