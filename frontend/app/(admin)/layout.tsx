import Link from "next/link";
import { redirect } from "next/navigation";

import type { ReactNode } from "react";

import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
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
        <Link href="/chat">Back to chat</Link>
      </div>
      {children}
    </main>
  );
}
