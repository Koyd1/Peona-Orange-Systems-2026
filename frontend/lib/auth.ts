import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { findUserByEmail, verifyUserPassword } from "@/lib/user-store";
import { createAppSession, getSessionById, isSessionActive } from "@/lib/session";

function asSessionId(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asRole(value: unknown): "ADMIN" | "USER" {
  return value === "ADMIN" ? "ADMIN" : "USER";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(rawCredentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(8)
          })
          .safeParse(rawCredentials);

        if (!parsed.success) {
          return null;
        }

        const user = await findUserByEmail(parsed.data.email);
        if (!user) {
          return null;
        }

        const isValid = await verifyUserPassword(user, parsed.data.password);
        if (!isValid) {
          return null;
        }

        const session = createAppSession(user.id, true);

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          sessionId: session.id
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.sessionId = user.sessionId;
      }

      const sessionId = asSessionId(token.sessionId);
      if (sessionId && !isSessionActive(sessionId)) {
        delete token.sessionId;
        delete token.persistent;
        delete token.expiresAt;
      }

      if (sessionId) {
        const appSession = getSessionById(sessionId);
        if (appSession) {
          token.persistent = appSession.persistent;
          token.expiresAt = appSession.expiresAt.toISOString();
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.role = asRole(token.role);
      session.sessionId = asSessionId(token.sessionId);
      session.persistent = token.persistent === true;
      session.expiresAt =
        typeof token.expiresAt === "string" ? token.expiresAt : undefined;
      return session;
    }
  }
});
