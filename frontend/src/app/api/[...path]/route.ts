import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

const backendUrl = process.env.BACKEND_URL?.replace(/\/+$/, "");

function jsonError(message: string, status: number) {
  return NextResponse.json({ detail: message }, { status });
}

function backendRequestUrl(request: NextRequest, path: string[]) {
  if (!backendUrl) return null;

  const url = new URL(request.url);
  const backendPath = path.join("/").replace(/\/+$/, "");
  const backend = new URL(`${backendUrl}/api/${backendPath}/`);
  backend.search = url.search;

  return backend;
}

function proxyHeaders(request: NextRequest) {
  const headers = new Headers(request.headers);

  headers.delete("host");
  headers.delete("content-length");
  headers.delete("x-forwarded-host");
  headers.set("x-forwarded-host", request.headers.get("host") ?? "");
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));

  return headers;
}

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  const url = backendRequestUrl(request, path);

  if (!url) {
    return jsonError(
      "BACKEND_URL não está configurada na Vercel. Configure a URL do backend no Render e faça um novo deploy.",
      502,
    );
  }

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers: proxyHeaders(request),
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
    init.duplex = "half";
  }

  const response = await fetch(url, init);
  const headers = new Headers(response.headers);

  headers.delete("content-encoding");
  headers.delete("content-length");
  headers.delete("transfer-encoding");

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}
