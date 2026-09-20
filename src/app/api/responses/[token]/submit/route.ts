import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, EXPORTS_BUCKET } from "@/lib/supabase-admin";
import { buildContentModel } from "@/lib/document/content-model";
import { generateDocx } from "@/lib/document/to-docx";
import { generatePdf } from "@/lib/document/to-pdf";
import { emailConfigured, sendSubmissionEmail } from "@/lib/email";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ token: string }> };

function makeSubmissionRef(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 89999);
  return `WFC-${year}-${rand}`;
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { token } = await ctx.params;
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const data = (body as { data?: Record<string, unknown> })?.data;
  if (!data || typeof data !== "object") {
    return NextResponse.json({ error: "Missing 'data'" }, { status: 400 });
  }

  const db = supabaseAdmin();

  // Reuse the existing submission reference on resubmission so links/refs stay stable.
  const { data: existing } = await db
    .from("responses")
    .select("submission_ref")
    .eq("token", token)
    .maybeSingle();

  const submissionRef = (existing?.submission_ref as string | undefined) || makeSubmissionRef();
  const submittedAt = new Date().toISOString();

  const finalData: Record<string, unknown> = {
    ...data,
    submitted: true,
    submissionRef,
    submissionDate: submittedAt.slice(0, 10),
  };

  const { error: saveErr } = await db
    .from("responses")
    .upsert(
      { token, data: finalData, submitted: true, submission_ref: submissionRef, submitted_at: submittedAt },
      { onConflict: "token" }
    );
  if (saveErr) return NextResponse.json({ error: saveErr.message }, { status: 500 });

  // Build documents
  const contentModel = buildContentModel(finalData);
  const [docxBuffer, pdfBuffer] = await Promise.all([
    generateDocx(contentModel),
    Promise.resolve(generatePdf(contentModel)),
  ]);

  const pdfPath = `${token}/${submissionRef}.pdf`;
  const docxPath = `${token}/${submissionRef}.docx`;

  const [pdfUpload, docxUpload] = await Promise.all([
    db.storage.from(EXPORTS_BUCKET).upload(pdfPath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    }),
    db.storage.from(EXPORTS_BUCKET).upload(docxPath, docxBuffer, {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      upsert: true,
    }),
  ]);

  const storageError = pdfUpload.error?.message || docxUpload.error?.message || null;

  let emailSent = false;
  let emailError: string | null = null;
  const respondent = (finalData.respondent as Record<string, unknown>) || {};
  if (emailConfigured()) {
    const result = await sendSubmissionEmail({
      respondentName: String(respondent.name || ""),
      company: String(respondent.company || ""),
      submissionRef,
      pdfBuffer,
      docxBuffer,
    });
    emailSent = result.sent;
    emailError = result.error || null;
  }
  // Email isn't set up yet — skip silently rather than surfacing a
  // confusing "email failed" message on the confirmation screen.

  await db
    .from("responses")
    .update({
      pdf_path: storageError ? null : pdfPath,
      docx_path: storageError ? null : docxPath,
      email_sent: emailSent,
      email_error: emailError,
    })
    .eq("token", token);

  let pdfUrl: string | null = null;
  let docxUrl: string | null = null;
  if (!storageError) {
    const [pdfSigned, docxSigned] = await Promise.all([
      db.storage.from(EXPORTS_BUCKET).createSignedUrl(pdfPath, 3600),
      db.storage.from(EXPORTS_BUCKET).createSignedUrl(docxPath, 3600),
    ]);
    pdfUrl = pdfSigned.data?.signedUrl ?? null;
    docxUrl = docxSigned.data?.signedUrl ?? null;
  }

  return NextResponse.json({
    submissionRef,
    submissionDate: submittedAt.slice(0, 10),
    pdfUrl,
    docxUrl,
    emailSent,
    emailError,
    storageError,
  });
}
