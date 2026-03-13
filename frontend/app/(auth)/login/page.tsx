import Link from "next/link";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/lib/auth";
import LoginForm from "@/components/auth/LoginForm";
import { Card } from "@/components/ui/card";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";

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
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-[420px] p-8 text-center shadow-hover">
        <div className="flex justify-center mb-3">
          <img
            src="/icons/hr_assistant_logo.svg"
            alt="HR AI Assistant logo"
            className="h-[88px] w-[88px] object-contain"
          />
        </div>
        <h1 className="text-2xl font-semibold leading-snug">Panoul de administrare</h1>
        <p className="text-sm text-gray-400 mb-6">
          Autentificați-vă în sistemul de administrare HR AI Assistant
        </p>

        <LoginForm loginAction={loginAction} serverError={params.error} />

        <p className="text-sm mt-4">
          <Link href="/chat" className="text-orange-600 no-underline hover:underline">
            Întoarce-te la chat
          </Link>
        </p>
      </Card>
    </div>
  );
}
