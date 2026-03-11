"use client";

import { useState } from "react";
import SubmitButton from "./SubmitButton";

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
        <div className="alert alert-error" style={{ marginBottom: 12 }}>
          {errorMessage}
        </div>
      ) : null}

      <form action={loginAction} onSubmit={handleSubmit} noValidate>
        <div className="input-group">
          <label htmlFor="email">Email</label>
          <div className="input-wrapper">
            <span className="input-icon">✉</span>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="admin@company.com"
            />
          </div>
          {fieldErrors.email ? (
            <span className="text-xs text-error">{fieldErrors.email}</span>
          ) : null}
        </div>

        <div className="input-group">
          <label htmlFor="password">Parolă</label>
          <div className="input-wrapper">
            <span className="input-icon">🔒</span>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
            />
          </div>
          {fieldErrors.password ? (
            <span className="text-xs text-error">{fieldErrors.password}</span>
          ) : null}
        </div>

        <SubmitButton>Autentificare</SubmitButton>
      </form>
    </>
  );
}
