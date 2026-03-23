"use client";

import { useSearchParams } from "next/navigation";

function SkeletonBlock({
  className,
}: {
  className: string;
}) {
  return <div className={`animate-pulse rounded-full bg-[#eef2f8] ${className}`} />;
}

function FloatingGlow({
  className,
}: {
  className: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`absolute rounded-full blur-3xl ${className}`}
    />
  );
}

function ChatComposerSkeleton({
  mode = "thread",
}: {
  mode?: "thread" | "welcome";
}) {
  const isWelcome = mode === "welcome";

  return (
    <div
      className={`mx-auto w-full shrink-0 border border-white/80 bg-white/88 shadow-[0_26px_70px_-44px_rgba(15,23,42,0.45)] backdrop-blur ${
        isWelcome
          ? "max-w-[1080px] rounded-full px-6 py-5"
          : "max-w-[1180px] rounded-[34px] px-5 py-4 sm:px-7 sm:py-5"
      }`}
    >
      <div className="flex items-center gap-4">
        <SkeletonBlock className={`rounded-full bg-[#fae9db] ${isWelcome ? "h-16 w-16" : "h-14 w-14"}`} />
        <div className={`min-w-0 flex-1 ${isWelcome ? "" : "space-y-3"}`}>
          <SkeletonBlock className={`rounded-full ${isWelcome ? "h-5 w-[62%]" : "h-5 w-[78%] rounded-md"}`} />
          {!isWelcome ? <SkeletonBlock className="h-5 w-[44%] rounded-md" /> : null}
        </div>
        <SkeletonBlock className={`rounded-full bg-[#f8d3aa] ${isWelcome ? "h-16 w-16" : "h-14 w-14"}`} />
      </div>
    </div>
  );
}

function ExistingThreadSkeleton() {
  return (
    <div aria-hidden="true" className="mx-auto flex h-full w-full max-w-[1480px] flex-1 flex-col gap-8">
      <div className="flex items-center justify-start pt-1">
        <SkeletonBlock className="h-11 w-44 rounded-full bg-white shadow-[0_12px_26px_-20px_rgba(15,23,42,0.35)]" />
      </div>

      <div className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col gap-8 overflow-hidden pb-4">
        <div className="flex justify-end">
          <div className="w-full max-w-[860px] space-y-3">
            <div className="ml-auto h-28 w-full max-w-[700px] animate-pulse rounded-[32px] bg-[#f2be90] shadow-[0_18px_38px_-28px_rgba(229,139,58,0.45)]" />
          </div>
        </div>

        <div className="flex justify-start">
          <div className="flex w-full max-w-[1120px] items-start gap-4 sm:gap-5">
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-[#e58b3a]" />
            <div className="min-w-0 flex-1 rounded-[32px] border border-white/85 bg-white/90 px-6 py-6 shadow-[0_22px_54px_-34px_rgba(15,23,42,0.24)]">
              <div className="space-y-3">
                <SkeletonBlock className="h-5 w-full max-w-[760px] rounded-md" />
                <SkeletonBlock className="h-5 w-full max-w-[700px] rounded-md" />
                <SkeletonBlock className="h-5 w-full max-w-[540px] rounded-md" />
              </div>
              <div className="mt-6 grid gap-3 lg:grid-cols-2">
                <div className="rounded-[24px] border border-[#eef2f6] bg-white px-4 py-4 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.32)]">
                  <SkeletonBlock className="h-4 w-36 rounded-md" />
                  <SkeletonBlock className="mt-3 h-4 w-full rounded-md" />
                  <SkeletonBlock className="mt-2 h-4 w-4/5 rounded-md" />
                </div>
                <div className="rounded-[24px] border border-[#eef2f6] bg-white px-4 py-4 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.32)]">
                  <SkeletonBlock className="h-4 w-40 rounded-md" />
                  <SkeletonBlock className="mt-3 h-4 w-full rounded-md" />
                  <SkeletonBlock className="mt-2 h-4 w-3/4 rounded-md" />
                </div>
              </div>
              <div className="mt-6 border-t border-border/70 pt-4">
                <div className="flex items-center justify-between gap-4">
                  <SkeletonBlock className="h-5 w-64 rounded-md" />
                  <div className="flex items-center gap-3">
                    <SkeletonBlock className="h-11 w-11 rounded-full bg-[#eff3f9]" />
                    <SkeletonBlock className="h-11 w-11 rounded-full bg-[#eff3f9]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="w-full max-w-[860px] space-y-3">
            <div className="ml-auto h-24 w-full max-w-[560px] animate-pulse rounded-[30px] bg-[#f5cda8] shadow-[0_18px_36px_-28px_rgba(229,139,58,0.35)]" />
          </div>
        </div>
      </div>

      <ChatComposerSkeleton />
    </div>
  );
}

function FreshSessionSkeleton() {
  return (
    <div aria-hidden="true" className="mx-auto flex h-full w-full max-w-[1500px] flex-1 flex-col gap-8">
      <div className="flex items-center justify-start pt-1">
        <div className="inline-flex items-center gap-3 rounded-full border border-[#f2c39a] bg-[#fff1e4] px-6 py-3 shadow-[0_12px_26px_-20px_rgba(229,139,58,0.25)]">
          <SkeletonBlock className="h-4 w-4 rounded-full bg-[#f0bf8f]" />
          <SkeletonBlock className="h-5 w-28 rounded-md bg-[#f0bf8f]" />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col justify-center gap-12 pb-6 text-center">
        <div className="space-y-5">
          <SkeletonBlock className="mx-auto h-16 w-full max-w-[740px] rounded-[22px] bg-[#f6d5b5]" />
          <SkeletonBlock className="mx-auto h-10 w-full max-w-[500px] rounded-[16px] bg-[#f6d5b5]" />
        </div>

        <div className="mx-auto w-full max-w-[1080px] text-left">
          <SkeletonBlock className="mb-4 h-5 w-12 rounded-md bg-[#d6dfeb]" />
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex h-[62px] items-center justify-center rounded-[20px] border border-border bg-white px-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.4)]"
              >
                <SkeletonBlock
                  className={`h-5 rounded-md ${
                    index % 4 === 0
                      ? "w-52"
                      : index % 4 === 1
                        ? "w-60"
                        : index % 4 === 2
                          ? "w-44"
                          : "w-64"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[1080px] shrink-0 pt-2 sm:pt-3">
        <ChatComposerSkeleton mode="welcome" />
      </div>
    </div>
  );
}

export default function UserLoading() {
  const searchParams = useSearchParams();
  const isFreshSession = searchParams.has("renew") || !searchParams.has("sid");

  return (
    <div className="relative left-1/2 right-1/2 -my-6 h-[calc(100dvh-64px)] w-[100dvw] -ml-[50dvw] -mr-[50dvw] overflow-hidden bg-page">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8fbff_0%,#fff9f4_40%,#f7faff_100%)]" />
      <FloatingGlow className="left-[-96px] top-[22%] h-72 w-72 bg-orange-100/80" />
      <FloatingGlow className="right-[-80px] top-[12%] h-80 w-80 bg-sky-100/80" />
      <FloatingGlow className="bottom-[-120px] left-[14%] h-96 w-96 bg-amber-50/90" />
      <FloatingGlow className="bottom-[-180px] right-[12%] h-[28rem] w-[28rem] bg-slate-100/90" />

      <div className="relative flex h-full w-full flex-col px-4 py-4 sm:px-6">
        {isFreshSession ? <FreshSessionSkeleton /> : <ExistingThreadSkeleton />}
      </div>
    </div>
  );
}
