"use client";

import { useEffect, useRef, useState } from "react";

type LocaleCode = "ro" | "ru" | "en";

type LocaleOption = {
  code: LocaleCode;
  label: string;
};

const LOCALES: LocaleOption[] = [
  { code: "ro", label: "Română" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];

const STORAGE_KEY = "peona_locale";

function isLocale(value: string | null): value is LocaleCode {
  return value === "ro" || value === "ru" || value === "en";
}

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<LocaleCode>("ro");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) {
      setCurrent(saved);
      document.documentElement.lang = saved;
      return;
    }

    const initial = document.documentElement.lang.toLowerCase();
    if (isLocale(initial)) {
      setCurrent(initial);
      window.localStorage.setItem(STORAGE_KEY, initial);
      return;
    }

    document.documentElement.lang = "ro";
    window.localStorage.setItem(STORAGE_KEY, "ro");
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (rootRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function applyLocale(next: LocaleCode) {
    setCurrent(next);
    setOpen(false);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Schimbă limba"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((state) => !state)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white outline-none ring-0 focus:outline-none focus-visible:outline-none"
      >
        {current.toUpperCase()}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-40 min-w-[228px] rounded-2xl border border-[#d9dde6] bg-white p-1.5 shadow-[0_10px_24px_-18px_rgba(16,24,40,0.48)] outline-none ring-0">
          {LOCALES.map((locale) => {
            const selected = locale.code === current;
            return (
              <button
                key={locale.code}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                className={`mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[0.95rem] font-medium transition-colors outline-none ring-0 last:mb-0 focus:outline-none focus-visible:outline-none ${
                  selected
                    ? "bg-[#ead6c4] text-[#2f2f2f]"
                    : "text-[#2f2f2f] hover:bg-[#f6eee7]"
                }`}
                onClick={() => applyLocale(locale.code)}
              >
                <span className="shrink-0 text-[0.95rem] font-medium tracking-normal">
                  {locale.code.toUpperCase()}
                </span>
                <span>{locale.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
