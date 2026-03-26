import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    googleId?: string;
    userId?: string;
  }
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const params = new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID!,
      client_secret: process.env.AUTH_GOOGLE_SECRET!,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken!,
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Failed to refresh token");
    }

    return {
      ...token,
      accessToken: data.access_token as string,
      accessTokenExpires: Date.now() + (data.expires_in as number) * 1000,
      refreshToken: data.refresh_token
        ? (data.refresh_token as string)
        : token.refreshToken,
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

const config: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial sign-in
      if (account && profile) {
        token.accessToken = account.access_token ?? undefined;
        token.refreshToken = account.refresh_token ?? undefined;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : undefined;
        token.googleId = (profile.sub as string) ?? undefined;
        return token;
      }

      // Return token if still valid
      if (
        token.accessTokenExpires &&
        Date.now() < token.accessTokenExpires - 60_000
      ) {
        return token;
      }

      // Token expired, refresh it
      if (token.refreshToken) {
        return refreshAccessToken(token);
      }

      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      if (token.userId) {
        session.user.id = token.userId;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      if (!account || !profile) return;

      const googleId = profile.sub as string;
      if (!googleId) return;

      const dbUser = await prisma.user.upsert({
        where: { googleId },
        create: {
          googleId,
          email: user.email!,
          name: user.name ?? null,
          image: user.image ?? null,
          accessToken: account.access_token ?? null,
          refreshToken: account.refresh_token ?? null,
          tokenExpiry: account.expires_at
            ? new Date(account.expires_at * 1000)
            : null,
        },
        update: {
          email: user.email!,
          name: user.name ?? null,
          image: user.image ?? null,
          accessToken: account.access_token ?? null,
          refreshToken: account.refresh_token ?? null,
          tokenExpiry: account.expires_at
            ? new Date(account.expires_at * 1000)
            : null,
        },
      });

      // Store the DB user id on the user object so it flows into the JWT
      user.id = dbUser.id;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
