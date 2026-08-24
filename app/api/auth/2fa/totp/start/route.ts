import { NextRequest } from "next/server";
import { proxyAuthedPost } from "@/lib/api/proxy";

export function POST(request: NextRequest) {
  return proxyAuthedPost("/auth/2fa/totp/start", request);
}
