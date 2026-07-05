import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiClient, ApiError } from "@/lib/api/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.accessToken || session.error) {
    return NextResponse.json(
      { success: false, message: "Not authenticated", errors: null },
      { status: 401 }
    );
  }

  if (session.user.userType !== "ADMIN") {
    return NextResponse.json(
      { success: false, message: "You do not have permission", errors: null },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const resolvedParams = await params;
    const data = await apiClient.patch(`/users/${resolvedParams.id}/role`, body, {
      token: session.accessToken,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        error.data ?? { success: false, message: error.message, errors: null },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, message: "Unexpected error", errors: null },
      { status: 500 }
    );
  }
}
