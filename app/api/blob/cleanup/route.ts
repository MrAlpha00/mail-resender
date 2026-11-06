import { del, list } from "@vercel/blob";
import { NextResponse } from "next/server";

import { BLOB_UPLOAD_TTL_MS } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_PAGES = 20;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Attachment storage is not configured." },
      { status: 503 },
    );
  }

  const cutoff = Date.now() - BLOB_UPLOAD_TTL_MS;
  let cursor: string | undefined;
  let scanned = 0;
  let deleted = 0;

  try {
    for (let pageCount = 0; pageCount < MAX_PAGES; pageCount += 1) {
      const page = await list({
        prefix: "maildrop/",
        cursor,
        limit: 1000,
        token,
      });

      scanned += page.blobs.length;
      const expired = page.blobs
        .filter((blob) => blob.uploadedAt.getTime() < cutoff)
        .map((blob) => blob.pathname);

      if (expired.length > 0) {
        await del(expired, { token });
        deleted += expired.length;
      }

      if (!page.hasMore || !page.cursor) break;
      cursor = page.cursor;
    }

    return NextResponse.json({ ok: true, scanned, deleted });
  } catch {
    return NextResponse.json({ ok: false, error: "Cleanup failed." }, { status: 500 });
  }
}
