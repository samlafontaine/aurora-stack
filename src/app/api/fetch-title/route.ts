import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        // Mimic a browser so sites don't block the request
        "User-Agent":
          "Mozilla/5.0 (compatible; LinkStash/1.0; +https://github.com)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(5000),
    });

    const html = await res.text();

    // Extract <title> tag content
    const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = match ? match[1].trim() : null;

    return NextResponse.json({ title });
  } catch {
    return NextResponse.json({ title: null });
  }
}
