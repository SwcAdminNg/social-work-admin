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

  try {
    const data = await apiClient.get("/users/me", { token: session.accessToken });
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

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.accessToken || session.error) {
    return NextResponse.json(
      { success: false, message: "Not authenticated", errors: null },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const data = await apiClient.patch("/users/me", body, { token: session.accessToken });
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
