import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiClient, ApiError } from "@/lib/api/client";

type RouteParams = { params: Promise<{ path?: string[] }> };

async function forward(
  request: NextRequest,
  { params }: RouteParams,
  method: "GET" | "POST",
) {
  const session = await auth();

  if (!session?.accessToken || session.error) {
    return NextResponse.json(
      { success: false, message: "Not authenticated", errors: null },
      { status: 401 },
    );
  }

  if (session.user.userType !== "ADMIN" && session.user.userType !== "INSTRUCTOR") {
    return NextResponse.json(
      { success: false, message: "You do not have permission to manage essay marks", errors: null },
      { status: 403 },
    );
  }

  const { path } = await params;
  const segments = path ?? [];
  const backendPath = `/essay-marks${segments.length ? "/" + segments.join("/") : ""}${request.nextUrl.search}`;
  const body = method === "POST" ? await request.json().catch(() => undefined) : undefined;

  try {
    const options = { token: session.accessToken };
    const data =
      method === "GET"
        ? await apiClient.get(backendPath, options)
        : await apiClient.post(backendPath, body, options);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.data ?? { success: false, message: error.message, errors: null }, {
        status: error.status,
      });
    }
    return NextResponse.json(
      { success: false, message: "Unexpected error contacting the essay mark service", errors: null },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest, ctx: RouteParams) {
  return forward(request, ctx, "GET");
}

export async function POST(request: NextRequest, ctx: RouteParams) {
  return forward(request, ctx, "POST");
}
