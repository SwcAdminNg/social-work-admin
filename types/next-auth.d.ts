import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    firstName: string;
    lastName: string;
    username: string;
    userType: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    keepLoggedIn: boolean;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      firstName: string;
      lastName: string;
      username: string;
      userType: string;
    };
    accessToken: string;
    error?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    userType: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    keepLoggedIn: boolean;
    error?: string;
  }
}
