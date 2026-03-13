import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import AdminTopNav from "@/components/admin/AdminTopNav";
import LogoutButton from "@/components/auth/LogoutButton";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
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
      <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-3">
        <div className="flex min-w-0 items-center gap-8 overflow-x-auto">
          <Link
            href="/admin/knowledge"
            className="flex shrink-0 items-center gap-3 text-xl font-bold text-gray-900 no-underline hover:no-underline"
          >
            <span className="inline-flex items-center justify-center w-10 h-10">
              <img
                src="/icons/hr_assistant_logo.svg"
                alt="HR AI Assistant logo"
                className="w-10 h-10 object-contain"
              />
            </span>
            Admin Panel
          </Link>
          <AdminTopNav />
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm text-gray-500">{session.user.email}</span>
          <LogoutButton />
          <LanguageSwitcher />
        </div>
      </header>
      <main className="max-w-[960px] mx-auto px-6 py-6">
        {children}
      </main>
    </>
  );
}
