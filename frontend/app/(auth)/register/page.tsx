import Link from "next/link";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/lib/auth";
import { registerUser } from "@/lib/user-store";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function RegisterPage({ searchParams }: PageProps) {
  const params = await searchParams;

  async function registerAction(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!email || password.length < 8) {
      redirect("/register?error=Invalid+input");
    }

    try {
      await registerUser({ email, password, role: "USER" });
      await signIn("credentials", {
        email,
        password,
        redirectTo: "/chat"
      });
    } catch (error) {
      if (error instanceof Error && error.message === "USER_EXISTS") {
        redirect("/register?error=User+already+exists");
      }

      if (error instanceof AuthError) {
        redirect("/register?error=Auth+error");
      }

      throw error;
    }
  }

  return (
    <main>
      <div className="card">
        <h1>Register</h1>
        <p>Создайте аккаунт пользователя.</p>
        {params.error ? <p style={{ color: "#b42318" }}>{params.error}</p> : null}

        <form action={registerAction}>
          <input name="email" type="email" placeholder="Email" required />
          <input
            name="password"
            type="password"
            minLength={8}
            placeholder="Password"
            required
          />
          <button type="submit">Create account</button>
        </form>

        <p>
          Уже есть аккаунт? <Link href="/login">Войти</Link>
        </p>
      </div>
    </main>
  );
}
