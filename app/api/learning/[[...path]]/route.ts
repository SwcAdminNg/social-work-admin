import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiClient, ApiError } from "@/lib/api/client";

type RouteParams = { params: Promise<{ path?: string[] }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.accessToken || session.error) {
    return NextResponse.json(
      { success: false, message: "Not authenticated", errors: null },
      { status: 401 },
    );
  }

  if (session.user.userType !== "ADMIN" && session.user.userType !== "INSTRUCTOR") {
    return NextResponse.json(
      {
        success: false,
        message: "You do not have permission to view this",
        errors: null,
      },
      { status: 403 },
    );
  }

  const { path } = await params;
  const segments = path ?? [];
  const backendPath = `/learning${segments.length ? "/" + segments.join("/") : ""}${request.nextUrl.search}`;

  try {
    const data = await apiClient.get(backendPath, { token: session.accessToken });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        error.data ?? { success: false, message: error.message, errors: null },
        { status: error.status },
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: "Unexpected error contacting the course service",
        errors: null,
      },
      { status: 500 },
    );
  }
}
