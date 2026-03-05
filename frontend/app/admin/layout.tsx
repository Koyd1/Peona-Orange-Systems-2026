import Link from "next/link";
import { redirect } from "next/navigation";

import type { ReactNode } from "react";

import { auth } from "@/lib/auth";

export default async function AdminRouteLayout({
  children
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
    <main>
      <div className="card" style={{ marginBottom: 16 }}>
        <strong>Admin area</strong>
        <p>{session.user.email}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/admin/knowledge">Knowledge</Link>
          <Link href="/admin/prompts">Prompts</Link>
          <Link href="/admin/feedback">Feedback</Link>
          <Link href="/admin/health">Health</Link>
          <Link href="/chat">Back to chat</Link>
        </div>
      </div>
      {children}
    </main>
  );
}
