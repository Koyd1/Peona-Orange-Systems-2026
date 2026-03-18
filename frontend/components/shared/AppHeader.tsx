import Link from "next/link";
import type { ReactNode } from "react";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { getServerTranslator } from "@/lib/i18n/server";

type AppHeaderProps = {
  actions?: ReactNode;
};

export default async function AppHeader({ actions }: AppHeaderProps) {
  const { t } = await getServerTranslator();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-card px-6 py-3">
      <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 no-underline hover:no-underline">
        <span className="inline-flex items-center justify-center w-10 h-10">
          <img
            src="/icons/hr_assistant_logo.svg"
            alt={t("home.title")}
            className="w-10 h-10 object-contain"
          />
        </span>
        {t("common.brand")}
      </Link>
      <div className="flex items-center gap-3">
        {actions}
        <LanguageSwitcher />
      </div>
    </header>
  );
}
