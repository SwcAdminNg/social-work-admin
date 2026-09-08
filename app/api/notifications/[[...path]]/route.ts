import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiClient, ApiError } from "@/lib/api/client";

type RouteParams = { params: Promise<{ path?: string[] }> };

async function forward(
  request: NextRequest,
  { params }: RouteParams,
  method: "GET" | "POST" | "PATCH",
) {
  const session = await auth();

  if (!session?.accessToken || session.error) {
    return NextResponse.json(
      { success: false, message: "Not authenticated", errors: null },
      { status: 401 },
    );
  }

  const { path } = await params;
  const segments = path ?? [];
  const backendPath = `/notifications${segments.length ? "/" + segments.join("/") : ""}${request.nextUrl.search}`;

  let body: unknown;
  if (method === "POST" || method === "PATCH") {
    const text = await request.text();
    body = text ? JSON.parse(text) : undefined;
  }

  try {
    const options = { token: session.accessToken };
    const data =
      method === "GET"
        ? await apiClient.get(backendPath, options)
        : method === "POST"
          ? await apiClient.post(backendPath, body, options)
          : await apiClient.patch(backendPath, body, options);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        error.data ?? { success: false, message: error.message, errors: null },
        {
          status: error.status,
        },
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: "Unexpected error contacting the notifications service",
        errors: null,
      },
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

export async function PATCH(request: NextRequest, ctx: RouteParams) {
  return forward(request, ctx, "PATCH");
}
