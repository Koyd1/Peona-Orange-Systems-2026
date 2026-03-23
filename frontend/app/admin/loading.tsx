function SkeletonBar({
  className,
}: {
  className: string;
}) {
  return <div className={`animate-pulse rounded-full bg-[#eef2f8] ${className}`} />;
}

function SkeletonCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[30px] border border-[#e8eaf1] bg-white px-5 py-6 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.65)] md:px-7 ${className}`}
    >
      {children}
    </div>
  );
}

export default function AdminLoading() {
  return (
    <div aria-hidden="true" className="space-y-8 pt-3">
      <section className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-[760px] space-y-4">
          <SkeletonBar className="h-12 w-[320px] rounded-[18px] bg-[#e9edf7]" />
          <SkeletonBar className="h-6 w-full max-w-[620px]" />
          <SkeletonBar className="h-6 w-full max-w-[540px]" />
        </div>
        <SkeletonBar className="h-14 w-full rounded-[20px] xl:w-[300px]" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.95fr)]">
        <SkeletonCard className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <SkeletonBar className="h-9 w-[260px] rounded-[16px]" />
              <SkeletonBar className="h-5 w-[220px]" />
            </div>
            <div className="flex gap-3">
              <SkeletonBar className="h-11 w-[140px] rounded-[16px]" />
              <SkeletonBar className="h-11 w-[160px] rounded-[16px]" />
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-[#edf0f5] bg-white">
            <div className="border-b border-[#eef1f5] bg-[#fafbfe] px-5 py-4">
              <div className="grid grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <SkeletonBar key={index} className="h-4 w-full rounded-md" />
                ))}
              </div>
            </div>
            <div className="space-y-4 px-5 py-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="grid grid-cols-5 gap-4">
                  <SkeletonBar className="h-4 w-[80%] rounded-md" />
                  <SkeletonBar className="h-4 w-[70%] rounded-md" />
                  <SkeletonBar className="h-4 w-[92%] rounded-md" />
                  <SkeletonBar className="h-4 w-[68%] rounded-md" />
                  <SkeletonBar className="h-4 w-[50%] rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </SkeletonCard>

        <div className="space-y-6">
          <SkeletonCard className="space-y-5">
            <div className="space-y-3">
              <SkeletonBar className="h-8 w-[220px] rounded-[14px]" />
              <SkeletonBar className="h-5 w-full max-w-[260px]" />
            </div>
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[24px] border border-[#edf0f5] bg-[#fafbfe] px-4 py-4"
                >
                  <SkeletonBar className="h-5 w-[60%] rounded-md" />
                  <SkeletonBar className="mt-3 h-4 w-[85%] rounded-md" />
                  <SkeletonBar className="mt-2 h-4 w-[70%] rounded-md" />
                </div>
              ))}
            </div>
          </SkeletonCard>

          <SkeletonCard className="space-y-4">
            <SkeletonBar className="h-8 w-[180px] rounded-[14px]" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[22px] border border-[#edf0f5] bg-white px-4 py-5"
                >
                  <SkeletonBar className="h-4 w-[60%] rounded-md" />
                  <SkeletonBar className="mt-4 h-8 w-[48%] rounded-[12px]" />
                </div>
              ))}
            </div>
          </SkeletonCard>
        </div>
      </section>
    </div>
  );
}
