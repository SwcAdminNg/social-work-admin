import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiClient, ApiError } from "@/lib/api/client";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.accessToken || session.error) {
    return NextResponse.json(
      { success: false, message: "Not authenticated", errors: null },
      { status: 401 },
    );
  }

  if (session.user.userType !== "ADMIN") {
    return NextResponse.json(
      {
        success: false,
        message: "You do not have permission to manage users",
        errors: null,
      },
      { status: 403 },
    );
  }

  const backendPath = `/users${request.nextUrl.search}`;

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
        message: "Unexpected error contacting the user service",
        errors: null,
      },
      { status: 500 },
    );
  }
}
