import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { terminateSession } from "@/lib/session";

export async function POST() {
  const session = await auth();

  if (!session?.sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  terminateSession(session.sessionId);
  return NextResponse.json({ ok: true });
}
