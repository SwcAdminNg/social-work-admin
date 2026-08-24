import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiClient, ApiError } from "@/lib/api/client";

type RouteParams = { params: Promise<{ path?: string[] }> };

async function forward(
  request: NextRequest,
  { params }: RouteParams,
  method: "GET" | "POST" | "PATCH" | "DELETE",
) {
  const session = await auth();

  if (!session?.accessToken || session.error) {
    return NextResponse.json(
      { success: false, message: "Not authenticated", errors: null },
      { status: 401 },
    );
  }

  // FAQ management stays ADMIN-only, but the ticket queue is open to any staff member —
  // an ADMIN, or an INSTRUCTOR granted access via the "Support Desk" group. The backend is
  // the source of truth for the latter (it checks actual group membership); this is just a
  // coarse account-type gate so a plain USER account can never reach this proxy at all.
  if (session.user.userType !== "ADMIN" && session.user.userType !== "INSTRUCTOR") {
    return NextResponse.json(
      {
        success: false,
        message: "You do not have permission to manage help & support",
        errors: null,
      },
      { status: 403 },
    );
  }

  const { path } = await params;
  const segments = path ?? [];
  const backendPath = `/support${segments.length ? "/" + segments.join("/") : ""}${request.nextUrl.search}`;

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
          : method === "PATCH"
            ? await apiClient.patch(backendPath, body, options)
            : await apiClient.delete(backendPath, options);
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
        message: "Unexpected error contacting the help & support service",
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
