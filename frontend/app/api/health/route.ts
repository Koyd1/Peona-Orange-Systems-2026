import { NextResponse } from "next/server";

export async function GET() {
  const backendUrl = process.env.PYTHON_BACKEND_URL ?? "http://backend:8000";

  try {
    const response = await fetch(`${backendUrl}/health`, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({ status: "degraded" }, { status: 503 });
    }

    const data = await response.json();
    return NextResponse.json({ status: "ok", backend: data });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
