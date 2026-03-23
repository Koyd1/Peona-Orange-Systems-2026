function SkeletonBlock({
  className,
}: {
  className: string;
}) {
  return <div className={`animate-pulse rounded-full bg-[#eef2f8] ${className}`} />;
}

export default function AuthLoading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-6">
      <div className="absolute right-6 top-6">
        <SkeletonBlock className="h-10 w-10 rounded-full bg-[#e9edf7]" />
      </div>

      <div
        aria-hidden="true"
        className="w-full max-w-[420px] rounded-[32px] border border-border bg-white p-8 text-center shadow-[0_24px_60px_-48px_rgba(15,23,42,0.55)]"
      >
        <div className="mb-3 flex justify-center">
          <div className="h-[88px] w-[88px] animate-pulse rounded-[26px] bg-[#fbefe8]" />
        </div>
        <div className="space-y-3">
          <SkeletonBlock className="mx-auto h-10 w-64 rounded-[14px] bg-[#e9edf7]" />
          <SkeletonBlock className="mx-auto h-5 w-56 rounded-md" />
        </div>

        <div className="mt-8 space-y-5">
          <div className="space-y-2 text-left">
            <SkeletonBlock className="h-4 w-20 rounded-md" />
            <SkeletonBlock className="h-12 w-full rounded-[18px]" />
          </div>
          <div className="space-y-2 text-left">
            <SkeletonBlock className="h-4 w-24 rounded-md" />
            <SkeletonBlock className="h-12 w-full rounded-[18px]" />
          </div>
        </div>

        <SkeletonBlock className="mt-8 h-12 w-full rounded-full bg-[#f2a24d]" />
        <SkeletonBlock className="mx-auto mt-5 h-5 w-28 rounded-md" />
      </div>
    </div>
  );
}
