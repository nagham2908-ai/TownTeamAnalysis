import "server-only";

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.NOTIFY_TO_EMAIL);
}

export async function sendSubmissionEmail(opts: {
  respondentName: string;
  company: string;
  submissionRef: string;
  pdfBuffer: Buffer;
  docxBuffer: Buffer;
}): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_TO_EMAIL;
  const from = process.env.NOTIFY_FROM_EMAIL || "Town Team WFC Questionnaire <onboarding@resend.dev>";

  if (!apiKey || !to) {
    return { sent: false, error: "Email not configured (missing RESEND_API_KEY or NOTIFY_TO_EMAIL)." };
  }

  const subject = `WFC Questionnaire submitted — ${opts.company || opts.respondentName} (${opts.submissionRef})`;
  const html = `
    <p>The Workforce Compensation Requirements Questionnaire has been submitted.</p>
    <ul>
      <li><strong>Respondent:</strong> ${escapeHtml(opts.respondentName)}</li>
      <li><strong>Company:</strong> ${escapeHtml(opts.company)}</li>
      <li><strong>Reference:</strong> ${escapeHtml(opts.submissionRef)}</li>
    </ul>
    <p>The completed responses are attached as PDF and Word.</p>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        attachments: [
          {
            filename: `WFC_Questionnaire_${opts.submissionRef}.pdf`,
            content: opts.pdfBuffer.toString("base64"),
          },
          {
            filename: `WFC_Questionnaire_${opts.submissionRef}.docx`,
            content: opts.docxBuffer.toString("base64"),
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { sent: false, error: `Resend ${res.status}: ${body}` };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function escapeHtml(s: string): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}
