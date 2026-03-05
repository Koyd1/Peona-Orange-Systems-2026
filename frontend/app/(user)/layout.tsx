import Link from "next/link";

import type { ReactNode } from "react";

import { auth, signOut } from "@/lib/auth";

export default async function UserLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  async function logoutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <main>
      <div className="card" style={{ marginBottom: 16 }}>
        <strong>User area</strong>
        {session ? (
          <>
            <p>
              {session.user.email} · role: {session.user.role}
            </p>
            <form action={logoutAction}>
              <button type="submit">Logout</button>
            </form>
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
