import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import ChatWindow from "@/components/chat/ChatWindow";
import { auth } from "@/lib/auth";
import {
  PUBLIC_SESSION_COOKIE_NAME,
  verifyPublicSessionCookieValue
} from "@/lib/public-session";
import {
  createAppSession,
  getSessionById,
  isSessionActive
} from "@/lib/session";

type PageProps = {
  searchParams: Promise<{ sid?: string }>;
};

const PUBLIC_BOOTSTRAP_PATH = "/api/session/public/bootstrap" as any;

export default async function ChatPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sidFromUrl = typeof params.sid === "string" ? params.sid : "";

  const signedIn = await auth();
  if (signedIn?.sessionId && (await isSessionActive(signedIn.sessionId))) {
    if (sidFromUrl !== signedIn.sessionId) {
      redirect(`/chat?sid=${signedIn.sessionId}`);
    }

    const appSession = await getSessionById(signedIn.sessionId);
    if (!appSession || appSession.terminatedAt) {
      redirect("/login");
    }

    return (
      <ChatWindow
        sessionId={signedIn.sessionId}
        initialPersistent={appSession.persistent}
        initialExpiresAt={appSession.expiresAt.toISOString()}
        showSessionControls
      />
    );
  }

  const cookieStore = await cookies();
  const publicSessionId = verifyPublicSessionCookieValue(
    cookieStore.get(PUBLIC_SESSION_COOKIE_NAME)?.value
  );

  if (!publicSessionId || !(await isSessionActive(publicSessionId))) {
    redirect(PUBLIC_BOOTSTRAP_PATH);
  }

  if (sidFromUrl !== publicSessionId) {
    redirect(`/chat?sid=${publicSessionId}`);
  }

  const appSession = await getSessionById(publicSessionId);
  if (!appSession || appSession.terminatedAt) {
    redirect(PUBLIC_BOOTSTRAP_PATH);
  }

  return (
    <ChatWindow
      sessionId={publicSessionId}
      initialPersistent={appSession.persistent}
      initialExpiresAt={appSession.expiresAt.toISOString()}
      showSessionControls
    />
  );
}
