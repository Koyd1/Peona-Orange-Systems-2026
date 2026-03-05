import Link from "next/link";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/lib/auth";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;

  async function loginAction(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: "/admin"
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect("/login?error=Invalid+credentials");
      }
      throw error;
    }
  }

  return (
    <main>
      <div className="card">
        <h1>Login</h1>
        <p>Вход только для администратора.</p>
        {params.error ? <p style={{ color: "#b42318" }}>{params.error}</p> : null}

        <form action={loginAction}>
          <input name="email" type="email" placeholder="Email" required />
          <input
            name="password"
            type="password"
            minLength={8}
            placeholder="Password"
            required
          />
          <button type="submit">Sign In</button>
        </form>

        <p>
          Публичный чат доступен без логина: <Link href="/chat">/chat</Link>
        </p>
      </div>
    </main>
  );
}
