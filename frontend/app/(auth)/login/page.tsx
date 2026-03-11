import Link from "next/link";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/lib/auth";
import LoginForm from "@/components/auth/LoginForm";

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
        redirectTo: "/admin",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect("/login?error=credentials");
      }
      throw error;
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page-badge">
        <span className="lang-badge">RO</span>
      </div>

      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-icon logo-icon-lg">✦</span>
        </div>
        <h1 className="heading-3">Panoul de administrare</h1>
        <p className="text-sm text-muted" style={{ marginBottom: 24 }}>
          Autentificați-vă în sistemul de administrare HR AI Assistant
        </p>

        <LoginForm loginAction={loginAction} serverError={params.error} />

        <p className="text-sm" style={{ marginTop: 16 }}>
          <Link href="/chat">Întoarce-te la chat</Link>
        </p>
      </div>
    </div>
  );
}
