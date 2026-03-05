import { redirect } from "next/navigation";

import ChatWindow from "@/components/chat/ChatWindow";
import { auth } from "@/lib/auth";

export default async function ChatPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (!session.sessionId) {
    redirect("/login");
  }

  return <ChatWindow sessionId={session.sessionId} />;
}
