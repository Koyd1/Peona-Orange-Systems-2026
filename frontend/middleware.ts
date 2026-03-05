import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { isSessionActive } from "@/lib/session";

export default auth((req) => {
  const session = req.auth;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/chat") && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/chat", req.url));
    }
  }

  if (session?.sessionId && !isSessionActive(session.sessionId)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/chat/:path*", "/admin/:path*"]
};
