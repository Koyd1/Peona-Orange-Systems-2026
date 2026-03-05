import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export default auth(async (req) => {
  const session = req.auth;
  const sessionId = session?.sessionId;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!session || !sessionId) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/chat", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"]
};
