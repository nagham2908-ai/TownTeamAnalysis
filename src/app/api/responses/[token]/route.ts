import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, EXPORTS_BUCKET } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { token } = await ctx.params;
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: row, error } = await db
    .from("responses")
    .select("data, submitted, submission_ref, submitted_at, pdf_path, docx_path, updated_at")
    .eq("token", token)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ data: null, submitted: false });

  let pdfUrl: string | null = null;
  let docxUrl: string | null = null;
  if (row.pdf_path) {
    const { data } = await db.storage.from(EXPORTS_BUCKET).createSignedUrl(row.pdf_path as string, 3600);
    pdfUrl = data?.signedUrl ?? null;
  }
  if (row.docx_path) {
    const { data } = await db.storage.from(EXPORTS_BUCKET).createSignedUrl(row.docx_path as string, 3600);
    docxUrl = data?.signedUrl ?? null;
  }

  return NextResponse.json({
    data: row.data,
    submitted: row.submitted,
    submissionRef: row.submission_ref,
    submissionDate: row.submitted_at,
    updatedAt: row.updated_at,
    pdfUrl,
    docxUrl,
  });
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const { token } = await ctx.params;
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const data = (body as { data?: Record<string, unknown> })?.data;
  if (data === undefined) return NextResponse.json({ error: "Missing 'data'" }, { status: 400 });

  const db = supabaseAdmin();
  const { error } = await db.from("responses").upsert({ token, data }, { onConflict: "token" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
