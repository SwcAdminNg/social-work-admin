import { NextRequest, NextResponse } from "next/server";
import { apiClient, ApiError } from "@/lib/api/client";

export async function GET(request: NextRequest) {
  const backendPath = `/auth/username/suggestions${request.nextUrl.search}`;

  try {
    const data = await apiClient.get(backendPath);
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
        message: "Unexpected error contacting the auth service",
        errors: null,
      },
      { status: 500 },
    );
  }
}
