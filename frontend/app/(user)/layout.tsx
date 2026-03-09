import Link from "next/link";

import type { ReactNode } from "react";

import LogoutButton from "@/components/auth/LogoutButton";
import { auth } from "@/lib/auth";

export default async function UserLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <main>
      <div className="card" style={{ marginBottom: 16 }}>
        <strong>User area</strong>
        {session ? (
          <>
            <p>
              {session.user.email} · role: {session.user.role}
            </p>
            <LogoutButton />
            {session.user.role === "ADMIN" ? <Link href="/admin">Open admin</Link> : null}
          </>
        ) : (
          <p>
            Публичный режим чата. Для админ-панели используйте <Link href="/login">/login</Link>.
          </p>
        )}
      </div>
      {children}
    </main>
  );
}
