import { proxyAuthedGet } from "@/lib/api/proxy";

export function GET() {
  return proxyAuthedGet("/auth/2fa/status");
}
