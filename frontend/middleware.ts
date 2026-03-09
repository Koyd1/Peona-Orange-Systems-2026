import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

function asSessionId(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asRole(value: unknown): "ADMIN" | "USER" {
  return value === "ADMIN" ? "ADMIN" : "USER";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET
  });
  const sessionId = asSessionId(token?.sessionId);
  const role = asRole(token?.role);

  if (!token || !sessionId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (role !== "ADMIN") {
    return NextResponse.redirect(new URL("/chat", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
