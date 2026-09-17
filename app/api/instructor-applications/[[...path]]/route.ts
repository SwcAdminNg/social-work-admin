import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiClient, ApiError } from "@/lib/api/client";

type RouteParams = { params: Promise<{ path?: string[] }> };

async function forward(request: NextRequest, { params }: RouteParams, method: "GET" | "POST") {
  const session = await auth();

  if (!session?.accessToken || session.error) {
    return NextResponse.json({ success: false, message: "Not authenticated", errors: null }, { status: 401 });
  }

  // Reviewing instructor applications is admin-only — unlike Help & Support, there's no
  // secondary staff group that can be granted access here.
  if (session.user.userType !== "ADMIN") {
    return NextResponse.json(
      { success: false, message: "You do not have permission to review instructor applications", errors: null },
      { status: 403 }
    );
  }

  const { path } = await params;
  const segments = path ?? [];
  const backendPath = `/admin/instructor-applications${segments.length ? "/" + segments.join("/") : ""}${request.nextUrl.search}`;

  let body: unknown;
  if (method === "POST") {
    const text = await request.text();
    body = text ? JSON.parse(text) : undefined;
  }

  try {
    const options = { token: session.accessToken };
    const data = method === "GET" ? await apiClient.get(backendPath, options) : await apiClient.post(backendPath, body, options);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        error.data ?? { success: false, message: error.message, errors: null },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, message: "Unexpected error contacting the instructor applications service", errors: null },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, ctx: RouteParams) {
  return forward(request, ctx, "GET");
}

export async function POST(request: NextRequest, ctx: RouteParams) {
  return forward(request, ctx, "POST");
}
