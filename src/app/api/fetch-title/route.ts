import { NextRequest, NextResponse } from "next/server";
import https from "https";
import http from "http";

function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; LinkStash/1.0)",
          Accept: "text/html",
        },
        rejectUnauthorized: false,
        timeout: 5000,
      },
      (res) => {
        // Follow a single redirect
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          resolve(fetchHtml(res.headers.location));
          return;
        }

        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        res.on("error", reject);
      }
    );
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  try {
    const html = await fetchHtml(url);
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = match ? match[1].trim().replace(/\s+/g, " ") : null;
    return NextResponse.json({ title });
  } catch {
    return NextResponse.json({ title: null });
  }
}
