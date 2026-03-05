import { HealthPanel } from "@/components/admin/HealthPanel";

export default function AdminHealthPage() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1 style={{ margin: 0 }}>System health</h1>
      <HealthPanel />
    </div>
  );
}
