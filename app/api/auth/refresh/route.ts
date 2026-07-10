import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { refresh_token } = await request.json();

    if (!refresh_token) {
      return NextResponse.json(
        { success: false, message: "Missing refresh token" },
        { status: 400 }
      );
    }

    const apiUrl = process.env.API_BASE_URL ?? "http://localhost:8000";
    const res = await fetch(`${apiUrl}/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to refresh token" },
      { status: 500 }
    );
  }
}
