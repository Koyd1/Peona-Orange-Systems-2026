"use client";

import { useState } from "react";
import SubmitButton from "./SubmitButton";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

const ERROR_MESSAGES: Record<string, string> = {
  credentials: "Email sau parolă incorectă",
};

type Props = {
  loginAction: (formData: FormData) => Promise<void>;
  serverError?: string;
};

export default function LoginForm({ loginAction, serverError }: Props) {
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const errors: { email?: string; password?: string } = {};

    if (!email) {
      errors.email = "Introduceți adresa de email";
    }

    if (!password) {
      errors.password = "Introduceți parola";
    } else if (password.length < 8) {
      errors.password = "Parola trebuie să aibă cel puțin 8 caractere";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      e.preventDefault();
    }
  }

  const errorMessage = serverError
    ? ERROR_MESSAGES[serverError] ?? serverError
    : undefined;

  return (
    <>
      {errorMessage ? (
        <Alert variant="error" className="mb-3">
          {errorMessage}
        </Alert>
      ) : null}

      <form action={loginAction} onSubmit={handleSubmit} noValidate className="grid gap-4 text-left">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-semibold text-gray-900">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="admin@company.com"
            icon={<span>✉</span>}
          />
          {fieldErrors.email ? (
            <span className="text-xs text-red-600">{fieldErrors.email}</span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-semibold text-gray-900">
            Parolă
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            icon={<span>🔒</span>}
          />
          {fieldErrors.password ? (
            <span className="text-xs text-red-600">{fieldErrors.password}</span>
          ) : null}
        </div>

        <SubmitButton>Autentificare</SubmitButton>
      </form>
    </>
  );
}
