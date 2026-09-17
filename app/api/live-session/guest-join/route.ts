import { NextRequest, NextResponse } from "next/server";
import { apiClient, ApiError } from "@/lib/api/client";

// Public, unauthenticated — a guest never has a platform account or session.
// Forwards straight to the backend with no Authorization header.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Missing token", errors: null },
      { status: 400 },
    );
  }

  try {
    const data = await apiClient.get(
      `/courses/live-session/guest-join?token=${encodeURIComponent(token)}`,
    );
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        error.data ?? { success: false, message: error.message, errors: null },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { success: false, message: "Unexpected error contacting the course service", errors: null },
      { status: 500 },
    );
  }
}
