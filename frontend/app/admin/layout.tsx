import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import AppHeader from "@/components/shared/AppHeader";
import LogoutButton from "@/components/auth/LogoutButton";
import { auth } from "@/lib/auth";

export default async function AdminRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/chat");
  }

  return (
    <>
      <AppHeader
        actions={
          <>
            <span className="text-sm text-secondary">{session.user.email}</span>
            <LogoutButton />
          </>
        }
      />
      <nav className="admin-nav">
        <Link href="/admin/knowledge">Knowledge</Link>
        <Link href="/admin/prompts">Prompts</Link>
        <Link href="/admin/feedback">Feedback</Link>
        <Link href="/admin/health">Health</Link>
        <Link href="/chat">← Chat</Link>
      </nav>
      <main className="page-container-narrow">
        {children}
      </main>
    </>
  );
}
