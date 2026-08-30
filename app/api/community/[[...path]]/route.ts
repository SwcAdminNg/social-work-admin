import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiClient, ApiError } from "@/lib/api/client";

type RouteParams = { params: Promise<{ path?: string[] }> };

async function forward(
  request: NextRequest,
  { params }: RouteParams,
  method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT",
) {
  const session = await auth();

  if (!session?.accessToken || session.error) {
    return NextResponse.json(
      { success: false, message: "Not authenticated", errors: null },
      { status: 401 },
    );
  }

  // Every community endpoint accepts any authenticated user — the backend itself enforces
  // ADMIN on /community/custom and membership management (400/403 as documented) and
  // membership on everything else, so no client-side role gate here.
  const { path } = await params;
  const segments = path ?? [];
  const backendPath = `/community${segments.length ? "/" + segments.join("/") : ""}${request.nextUrl.search}`;

  let body: unknown;
  if (method === "POST" || method === "PATCH" || method === "PUT") {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      body = await request.formData();
    } else {
      const text = await request.text();
      body = text ? JSON.parse(text) : undefined;
    }
  }

  try {
    const options = { token: session.accessToken };
    const data =
      method === "GET"
        ? await apiClient.get(backendPath, options)
        : method === "POST"
          ? await apiClient.post(backendPath, body, options)
          : method === "PATCH"
            ? await apiClient.patch(backendPath, body, options)
            : method === "PUT"
              ? await apiClient.put(backendPath, body, options)
              : await apiClient.delete(backendPath, options);
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
        message: "Unexpected error contacting the community service",
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

export async function DELETE(request: NextRequest, ctx: RouteParams) {
  return forward(request, ctx, "DELETE");
}

export async function PUT(request: NextRequest, ctx: RouteParams) {
  return forward(request, ctx, "PUT");
}
