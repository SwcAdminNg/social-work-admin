import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

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
      credentials: {
        identifier: {},
        password: {},
        keepLoggedIn: {},
      },
      authorize: async (credentials) => {
        const identifier = credentials?.identifier as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!identifier || !password) return null;

        try {
          const { data } = await login({
            identifier,
            password,
            keep_logged_in: credentials?.keepLoggedIn === "true",
          });

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
        } catch (error) {
          if (error instanceof ApiError) {
            throw new Error(error.message);
          }
          throw new Error("Unable to sign in. Please try again.");
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        return { ...token, ...user };
      }

      if (!token.keepLoggedIn && Date.now() > token.accessTokenExpires) {
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
      session.error = token.error;
      return session;
    },
  },
});
