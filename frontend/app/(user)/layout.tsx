import Link from "next/link";
import { redirect } from "next/navigation";

import type { ReactNode } from "react";

import { auth, signOut } from "@/lib/auth";

export default async function UserLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  async function logoutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <main>
      <div className="card" style={{ marginBottom: 16 }}>
        <strong>User area</strong>
        <p>
          {session.user.email} · role: {session.user.role}
        </p>
        <form action={logoutAction}>
          <button type="submit">Logout</button>
        </form>
        {session.user.role === "ADMIN" ? <Link href="/admin">Open admin</Link> : null}
      </div>
      {children}
    </main>
  );
}
