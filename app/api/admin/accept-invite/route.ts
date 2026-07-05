import { NextRequest, NextResponse } from "next/server";
import { apiClient, ApiError } from "@/lib/api/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await apiClient.post("/admin/accept-invite", body);
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
