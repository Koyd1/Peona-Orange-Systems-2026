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
            <span className="text-sm text-gray-500">{session.user.email}</span>
            <LogoutButton />
          </>
        }
      />
      <nav className="flex gap-1 px-6 py-2 bg-card border-b border-border overflow-x-auto">
        <Link href="/admin/knowledge" className="text-sm font-medium text-gray-500 px-3 py-2 rounded-lg whitespace-nowrap no-underline hover:bg-gray-100 hover:text-gray-900 hover:no-underline">
          Knowledge
        </Link>
        <Link href="/admin/prompts" className="text-sm font-medium text-gray-500 px-3 py-2 rounded-lg whitespace-nowrap no-underline hover:bg-gray-100 hover:text-gray-900 hover:no-underline">
          Prompts
        </Link>
        <Link href="/admin/feedback" className="text-sm font-medium text-gray-500 px-3 py-2 rounded-lg whitespace-nowrap no-underline hover:bg-gray-100 hover:text-gray-900 hover:no-underline">
          Feedback
        </Link>
        <Link href="/admin/health" className="text-sm font-medium text-gray-500 px-3 py-2 rounded-lg whitespace-nowrap no-underline hover:bg-gray-100 hover:text-gray-900 hover:no-underline">
          Health
        </Link>
        <Link href="/chat" className="text-sm font-medium text-gray-500 px-3 py-2 rounded-lg whitespace-nowrap no-underline hover:bg-gray-100 hover:text-gray-900 hover:no-underline">
          ← Chat
        </Link>
      </nav>
      <main className="max-w-[960px] mx-auto px-6 py-6">
        {children}
      </main>
    </>
  );
}
