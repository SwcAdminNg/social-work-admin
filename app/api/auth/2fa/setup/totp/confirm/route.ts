import { NextRequest } from "next/server";
import { proxyPost } from "@/lib/api/proxy";

export function POST(request: NextRequest) {
  return proxyPost("/auth/2fa/setup/totp/confirm", request);
}
