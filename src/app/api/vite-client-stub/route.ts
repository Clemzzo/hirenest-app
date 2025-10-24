import { NextResponse } from "next/server";

export function GET() {
  // This stub avoids noisy 404s for /@vite/client requests in preview environments
  // It returns a tiny JS that does nothing.
  const js = `// vite client stub for preview\n`;
  return new NextResponse(js, {
    status: 200,
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}