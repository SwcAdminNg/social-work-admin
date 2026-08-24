import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { AuthSessionData } from "@/lib/api/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    // Long-lived cookie for "keep me logged in" users; sessions that didn't opt in
    // are invalidated as soon as the access token expires (see jwt callback below).
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    Credentials({
      // Password verification and two-factor authentication both happen
      // out-of-band, against the auth API's challenge-token endpoints, before
      // this provider is ever invoked (see components/auth/Login.tsx and
      // components/auth/twoFactor). By the time authorize() runs, the caller
      // already holds a completed AuthSessionDTO — this just turns it into a
      // NextAuth session.
      credentials: {
        verifiedSession: {},
        keepLoggedIn: {},
      },
      authorize: async (credentials) => {
        const verifiedSession = credentials?.verifiedSession as string | undefined;
        if (!verifiedSession) return null;

        let data: AuthSessionData;
        try {
          data = JSON.parse(verifiedSession);
        } catch {
          return null;
        }

        return {
          id: data.user.id,
          firstName: data.user.first_name,
          lastName: data.user.last_name,
          email: data.user.email,
          username: data.user.username,
          userType: data.user.user_type,
          accessToken: data.tokens.access_token,
          refreshToken: data.tokens.refresh_token,
          accessTokenExpires: Date.now() + data.tokens.expires_in * 1000,
          keepLoggedIn: credentials?.keepLoggedIn === "true",
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        return { ...token, ...user };
      }

      if (trigger === "update" && session) {
        token.accessToken = session.accessToken;
        token.refreshToken = session.refreshToken;
        token.accessTokenExpires = session.accessTokenExpires;
        token.error = undefined;
      }

      if (Date.now() > token.accessTokenExpires) {
        return { ...token, error: "SessionExpired" };
      }

      return token;
    },
    session: async ({ session, token }) => {
      session.user = {
        ...session.user,
        id: token.id,
        firstName: token.firstName,
        lastName: token.lastName,
        username: token.username,
        userType: token.userType,
      };
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.accessTokenExpires = token.accessTokenExpires;
      session.error = token.error;
      return session;
    },
  },
});
