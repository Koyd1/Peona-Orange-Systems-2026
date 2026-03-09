import { redirect } from "next/navigation";

import ChatWindow from "@/components/chat/ChatWindow";
import { prisma } from "@/lib/db";
import {
  createAppSession,
  findEmptyActiveSession,
  getSessionById,
  isSessionActive
} from "@/lib/session";

type PageProps = {
  searchParams: Promise<{ sid?: string }>;
};

async function ensurePublicUserId(): Promise<string> {
  const guest = await prisma.user.upsert({
    where: { email: "guest@public.local" },
    update: { role: "USER" },
    create: {
      email: "guest@public.local",
      passwordHash: "__public_access__",
      role: "USER"
    },
    select: { id: true }
  });

  return guest.id;
}

export default async function ChatPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sid = typeof params.sid === "string" ? params.sid : "";

  if (!sid || !(await isSessionActive(sid))) {
    const userId = await ensurePublicUserId();
    const existing = await findEmptyActiveSession(userId);
    if (existing) {
      redirect(`/chat?sid=${existing.id}`);
    }
    const newSession = await createAppSession(userId, true);
    redirect(`/chat?sid=${newSession.id}`);
  }

  const appSession = await getSessionById(sid);
  if (!appSession || appSession.terminatedAt) {
    const userId = await ensurePublicUserId();
    const existing = await findEmptyActiveSession(userId);
    if (existing) {
      redirect(`/chat?sid=${existing.id}`);
    }
    const newSession = await createAppSession(userId, true);
    redirect(`/chat?sid=${newSession.id}`);
  }

  return (
    <ChatWindow
      sessionId={sid}
      initialPersistent={appSession.persistent}
      initialExpiresAt={appSession.expiresAt.toISOString()}
      showSessionControls
    />
  );
}
