import Link from "next/link";
import type { ReactNode } from "react";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";

type AppHeaderProps = {
  actions?: ReactNode;
};

export default function AppHeader({ actions }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-card px-6 py-3">
      <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 no-underline hover:no-underline">
        <span className="inline-flex items-center justify-center w-10 h-10">
          <img
            src="/icons/hr_assistant_logo.svg"
            alt="HR AI Assistant logo"
            className="w-10 h-10 object-contain"
          />
        </span>
        Peona
      </Link>
      <div className="flex items-center gap-3">
        {actions}
        <LanguageSwitcher />
      </div>
    </header>
  );
}
