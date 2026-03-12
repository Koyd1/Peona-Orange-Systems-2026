import { HealthPanel } from "@/components/admin/HealthPanel";

export default function AdminHealthPage() {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold m-0">System health</h1>
      </div>
      <HealthPanel />
    </div>
  );
}
