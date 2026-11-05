import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Forwards passkey requests to the API. Sign-in endpoints are public; the rest
// need a signed-in session. The page origin is added server-side so the API can
// bind each ceremony to this site, and the visitor's browser is passed on so
// devices get a recognisable name.
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000";
const PUBLIC = new Set(["check", "login/options", "login/verify"]);
const ALLOWED = /^(|check|login\/options|login\/verify|register\/options|register\/verify|[0-9a-f-]{36})$/i;

function originOf(req: Request) {
  const header = req.headers.get("origin");
  if (header) return header;
  const forwardedHost = req.headers.get("x-forwarded-host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return forwardedHost ? `${proto}://${forwardedHost}` : new URL(req.url).origin;
}

async function forward(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const subpath = path.join("/");
  if (!ALLOWED.test(subpath)) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Client-User-Agent": req.headers.get("user-agent") || "",
  };
  const visitorIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (visitorIp) headers["X-Forwarded-For"] = visitorIp;

  if (!PUBLIC.has(subpath)) {
    const session = await auth();
    if (!session?.accessToken || session.error) {
      return NextResponse.json({ message: "Please sign in again." }, { status: 401 });
    }
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  let body: string | undefined;
  if (req.method === "POST" || req.method === "PATCH") {
    const json = await req.json().catch(() => ({}));
    if (req.method === "POST") json.origin = originOf(req);
    body = JSON.stringify(json);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/passkeys${subpath ? `/${subpath}` : ""}`, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "We could not reach the server. Please try again." }, { status: 502 });
  }
}

export { forward as GET, forward as POST, forward as PATCH, forward as DELETE };
