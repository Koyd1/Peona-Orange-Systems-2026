import { HealthPanel } from "@/components/admin/HealthPanel";

export default function AdminHealthPage() {
  return (
    <div className="space-y-7">
      <section className="rounded-[30px] border border-[#e8eaf1] bg-white px-7 py-7 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.65)] md:px-10 md:py-9">
        <h1 className="m-0 text-[2rem] font-bold tracking-[-0.02em] text-[#111827] md:text-[2.35rem]">
          System Health
        </h1>
        <p className="mt-3 max-w-[680px] text-base leading-relaxed text-[#6b7280]">
          Verifici serviciile critice, costurile AI, distribuția modelelor și riscurile de halucinație, cu refresh automat la 30s.
        </p>
      </section>
      <HealthPanel />
    </div>
  );
}
