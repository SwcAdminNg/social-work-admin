import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiClient, ApiError } from "@/lib/api/client";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
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
        message: "You do not have permission to review instructor documents",
        errors: null,
      },
      { status: 403 },
    );
  }

  const { id } = await params;

  try {
    const data = await apiClient.get(`/users/${id}/documents`, { token: session.accessToken });
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
        message: "Unexpected error contacting the instructor document service",
        errors: null,
      },
      { status: 500 },
    );
  }
}
