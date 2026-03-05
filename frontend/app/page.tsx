import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  if (session?.user.role === "ADMIN") {
    redirect("/admin");
  }

  if (session) {
    redirect("/chat");
  }

  return (
    <main>
      <div className="card">
        <h1>HR Bot</h1>
        <p>Вход для пользователей и администраторов.</p>
        <p>
          <Link href="/login">Login</Link> | <Link href="/register">Register</Link>
        </p>
      </div>
    </main>
  );
}
