import os from "node:os";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getLanAddress() {
  const interfaces = os.networkInterfaces();

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) {
        return entry.address;
      }
    }
  }

  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lanAddress = getLanAddress();
  const port = url.port || (url.protocol === "https:" ? "443" : "80");
  const protocol = url.protocol || "http:";
  const host = lanAddress ? `${lanAddress}:${port}` : url.host;

  return NextResponse.json({
    fieldUrl: `${protocol}//${host}/field`,
    lanAddress
  });
}
