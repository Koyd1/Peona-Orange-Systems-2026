import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    sessionId?: string;
    user: DefaultSession["user"] & {
      role: "ADMIN" | "USER";
    };
  }

  interface User {
    role: "ADMIN" | "USER";
    sessionId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "ADMIN" | "USER";
    sessionId?: string;
  }
}
