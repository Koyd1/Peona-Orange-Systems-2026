"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

type LogoutButtonProps = {
  callbackUrl?: string;
};

export default function LogoutButton({ callbackUrl = "/login" }: LogoutButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    if (busy) {
      return;
    }

    setBusy(true);
    try {
      const result = await signOut({ redirect: false, callbackUrl });
      window.location.replace(result?.url ?? callbackUrl);
    } catch {
      window.location.replace(callbackUrl);
    }
  }

  return (
    <button type="button" disabled={busy} onClick={() => void handleLogout()}>
      {busy ? "Logging out..." : "Logout"}
    </button>
  );
}
