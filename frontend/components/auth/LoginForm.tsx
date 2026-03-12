"use client";

import type { FormEvent } from "react";
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
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
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
        <div className="flex flex-col gap-1.5" >
          <label htmlFor="email" className="text-sm font-semibold text-gray-900 ">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="admin@company.com"
            className="w-full border border-gray-300 rounded-full px-2 py-2"
            icon={<span className="flex items-center justify-center w-5 h-5 sm:w-7 sm:h-7" ><img src="/icons/logo_message.svg" 
                             alt="Email icon"
                              className="w-full h-full object-contain" /></span>}
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
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="w-full border border-gray-300 rounded-xl px-2 py-2"
            icon={<span className="flex items-center justify-center w-5 h-5 sm:w-7 sm:h-7" ><img src="/icons/square-lock.svg"
                             alt="Password icon"
                             className="w-full h-full object-contain"
                 /></span>}
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="flex items-center justify-center p-0.5 cursor-pointer"
                tabIndex={-1}
              >
                <img
                  src="/icons/eye_logo.svg"
                  alt=""
                  className="w-5 h-5 opacity-60 hover:opacity-100 transition-opacity"
                />
              </button>
            }
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
