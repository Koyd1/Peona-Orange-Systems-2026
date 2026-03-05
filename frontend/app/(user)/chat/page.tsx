import { redirect } from "next/navigation";

import ChatWindow from "@/components/chat/ChatWindow";
import { auth } from "@/lib/auth";
import { getSessionById } from "@/lib/session";

export default async function ChatPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (!session.sessionId) {
    redirect("/login");
  }

  const appSession = getSessionById(session.sessionId);
  if (!appSession) {
    redirect("/login");
  }

  return (
    <ChatWindow
      sessionId={session.sessionId}
      initialPersistent={appSession.persistent}
      initialExpiresAt={appSession.expiresAt.toISOString()}
    />
  );
}
