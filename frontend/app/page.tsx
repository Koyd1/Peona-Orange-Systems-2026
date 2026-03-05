import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  if (session?.user?.role === "ADMIN") {
    redirect("/admin");
  }

  redirect("/chat");

  return (
    <main>
      <div className="card">
        <h1>HR Bot</h1>
        <p>Публичный чат. Вход нужен только для админ-панели.</p>
        <p>
          <Link href="/chat">Open chat</Link> | <Link href="/login">Admin login</Link>
        </p>
      </div>
    </main>
  );
}
