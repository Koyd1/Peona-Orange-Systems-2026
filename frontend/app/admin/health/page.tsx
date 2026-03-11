import { HealthPanel } from "@/components/admin/HealthPanel";

export default function AdminHealthPage() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="section-header">
        <h1>System health</h1>
      </div>
      <HealthPanel />
    </div>
  );
}
