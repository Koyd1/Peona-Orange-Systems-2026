import Link from "next/link";
import type { ReactNode } from "react";

import AppHeader from "@/components/shared/AppHeader";
import LogoutButton from "@/components/auth/LogoutButton";
import { auth } from "@/lib/auth";

export default async function UserLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <>
      <AppHeader
        actions={
          session ? (
            <>
              <span className="text-sm text-secondary">{session.user.email}</span>
              <LogoutButton />
              {session.user.role === "ADMIN" ? (
                <Link href="/admin" className="btn btn-sm btn-secondary">
                  Admin
                </Link>
              ) : null}
            </>
          ) : (
            <Link href="/login" className="btn btn-sm btn-secondary">
              Login
            </Link>
          )
        }
      />
      <main className="page-container-narrow">
        {children}
      </main>
    </>
  );
}
