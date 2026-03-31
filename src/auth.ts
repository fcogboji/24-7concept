import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { EmailNotVerifiedError } from "@/lib/auth-errors";
import { prisma } from "@/lib/prisma";

const authSecret =
  process.env.AUTH_SECRET && process.env.AUTH_SECRET.trim().length > 0
    ? process.env.AUTH_SECRET
    : process.env.NODE_ENV === "production"
      ? undefined
      : "dev-only-insecure-secret-change-before-production";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: authSecret,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(8),
          })
          .safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        if (!user.emailVerifiedAt) {
          throw new EmailNotVerifiedError();
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          plan: user.plan,
          subscriptionStatus: user.subscriptionStatus,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = (user as { plan?: string }).plan ?? "free";
        token.subscriptionStatus = (user as { subscriptionStatus?: string | null }).subscriptionStatus ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        try {
          const u = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { plan: true, subscriptionStatus: true },
          });
          session.user.plan = u?.plan ?? "free";
          session.user.subscriptionStatus = u?.subscriptionStatus ?? null;
        } catch {
          session.user.plan = (token.plan as string) ?? "free";
          session.user.subscriptionStatus = (token.subscriptionStatus as string | null) ?? null;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
});
