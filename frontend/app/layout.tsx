import "./globals.css";

import { Inter } from "next/font/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import I18nProvider from "@/lib/i18n/I18nProvider";
import { getServerTranslator } from "@/lib/i18n/server";
import { toHtmlLang } from "@/lib/i18n/config";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Peona — HR AI Assistant",
  description: "HR AI Assistant Platform",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { locale } = await getServerTranslator();

  return (
    <html lang={toHtmlLang(locale)}>
      <body className={inter.className}>
        <I18nProvider initialLocale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
