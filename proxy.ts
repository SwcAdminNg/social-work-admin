import { NextResponse } from "next/server";
import { auth } from "@/auth";

const protectedPrefixes = ["/dashboard"];
const authPrefixes = ["/login", "/register", "/forgot-password", "/reset-password"];
const adminOnlyPrefixes = ["/dashboard/course-management"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth?.user && !req.auth?.error;

  const isProtectedRoute = protectedPrefixes.some((p) => pathname.startsWith(p));
  const isAuthRoute = authPrefixes.some((p) => pathname.startsWith(p));
  const isAdminOnlyRoute = adminOnlyPrefixes.some((p) => pathname.startsWith(p));

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminOnlyRoute && isAuthenticated && req.auth?.user?.userType !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/not-authorized", req.nextUrl));
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
