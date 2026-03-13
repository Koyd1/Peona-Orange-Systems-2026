import Link from "next/link";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/lib/auth";
import LoginForm from "@/components/auth/LoginForm";
import { Card } from "@/components/ui/card";

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
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-900 text-white text-xs font-bold">
          RO
        </span>
      </div>

      <Card className="w-full max-w-[420px] p-8 text-center shadow-hover">
        <div className="flex justify-center mb-3">
          <span className="inline-flex items-center justify-center w-[1.5em] h-[1.5em] 
          rounded-xl bg-gradient-to-br from-[#ef9f40] to-[#df8240] text-4xl ">
            <img src="/icons/main_logo.svg" alt="Peona logo" className="w-3/4 h-3/4 object-contain" />
          </span>
        </div>
        <h1 className="text-2xl font-semibold leading-snug mb-3">Admin Panel</h1>
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
