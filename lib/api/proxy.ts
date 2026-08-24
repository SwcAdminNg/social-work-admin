import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiClient, ApiError } from "@/lib/api/client";

function errorResponse(error: unknown) {
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

export async function proxyPost(backendPath: string, request: NextRequest) {
  try {
    const body = await request.json().catch(() => undefined);
    const data = await apiClient.post(backendPath, body);
    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function proxyAuthedPost(backendPath: string, request: NextRequest) {
  const session = await auth();

  if (!session?.accessToken || session.error) {
    return NextResponse.json(
      { success: false, message: "Not authenticated", errors: null },
      { status: 401 },
    );
  }

  try {
    const body = await request.json().catch(() => undefined);
    const data = await apiClient.post(backendPath, body, { token: session.accessToken });
    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function proxyAuthedGet(backendPath: string) {
  const session = await auth();

  if (!session?.accessToken || session.error) {
    return NextResponse.json(
      { success: false, message: "Not authenticated", errors: null },
      { status: 401 },
    );
  }

  try {
    const data = await apiClient.get(backendPath, { token: session.accessToken });
    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error);
  }
}
