function SkeletonBlock({
  className,
}: {
  className: string;
}) {
  return <div className={`animate-pulse rounded-full bg-[#eef2f8] ${className}`} />;
}

function SkeletonCard({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`rounded-[32px] border border-border bg-white p-8 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.55)] ${className}`}
    >
      <div className="space-y-5">
        <div className="inline-flex h-14 w-14 animate-pulse rounded-[18px] bg-[#fbefe8]" />
        <div className="space-y-3">
          <SkeletonBlock className="h-8 w-[220px] rounded-[14px]" />
          <SkeletonBlock className="h-5 w-full max-w-[320px]" />
          <SkeletonBlock className="h-5 w-full max-w-[280px]" />
        </div>
      </div>
      <SkeletonBlock className="mt-10 h-12 w-full rounded-full bg-[#eef2f8]" />
    </div>
  );
}

export default function GlobalLoading() {
  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center">
            <img
              src="/icons/hr_assistant_logo.svg"
              alt=""
              aria-hidden="true"
              className="h-10 w-10 object-contain"
            />
          </span>
          <SkeletonBlock className="h-7 w-28 rounded-[12px]" />
        </div>
        <SkeletonBlock className="h-10 w-10 rounded-full bg-[#e9edf7]" />
      </header>

      <main className="mx-auto max-w-[1200px] px-6 py-6">
        <div aria-hidden="true" className="pb-12 pt-16 text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-[104px] w-[104px] animate-pulse rounded-[30px] bg-[#fbefe8]" />
          </div>

          <div className="mx-auto max-w-[760px] space-y-4">
            <SkeletonBlock className="mx-auto h-14 w-full max-w-[520px] rounded-[18px] bg-[#e9edf7]" />
            <SkeletonBlock className="mx-auto h-6 w-full max-w-[640px]" />
            <SkeletonBlock className="mx-auto h-6 w-full max-w-[560px]" />
          </div>

          <div className="mx-auto mt-12 grid max-w-[820px] grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-8">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </main>
    </>
  );
}
