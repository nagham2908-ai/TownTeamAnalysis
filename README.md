# Town Team — WFC Requirements Questionnaire

The Oracle Fusion HCM Workforce Compensation requirements questionnaire, wired to a
real backend so the client's answers (including every row they add to a table) are
saved automatically as they work, and submitting it saves the final record, generates
a PDF and a Word document, and emails both to the consultant.

The original single-file questionnaire (`~/Desktop/TownTeam_WFC_Questionnaire.html`)
is preserved almost exactly as-is — same look, same wizard flow, same fields — as
`public/questionnaire/app.js` + `public/questionnaire/style.css`. Only the save/submit
plumbing was changed to talk to a server instead of the browser's local storage.

## How it works

- Visiting `/` gives the browser a private link `/q/<token>` and remembers it in
  `localStorage`, so reopening the site later resumes the same draft. You can also
  hand the client a specific link like `/q/townteam-2026` directly — any token string
  works.
- Every change (including "+ Add Row" on the plan register / matrices) is saved to
  Postgres ~0.6s after the client stops typing, via `PUT /api/responses/[token]`.
  A save indicator in the footer shows Saving… / Saved / Saved on this device (offline).
- **Submit** (`POST /api/responses/[token]/submit`) saves the final answers, builds a
  PDF and a `.docx` from them, uploads both to Supabase Storage, and emails them (via
  Resend) to the address in `NOTIFY_TO_EMAIL`. The client then sees download buttons
  for both files on the confirmation screen.

## One-time setup

### 1. Supabase (database + file storage)

1. Create a free project at [supabase.com](https://supabase.com).
2. Project Settings → API → copy the **Project URL** and the **service_role** key
   (not the anon key — the server needs the service role to bypass RLS, since there's
   no end-user login here; the token in the URL is the only "auth").
3. SQL Editor → paste the contents of `supabase/migrations/0001_init.sql` → Run.
   This creates the `responses` table and a private `wfc-exports` storage bucket.

### 2. Resend (email delivery)

1. Create a free account at [resend.com](https://resend.com).
2. Resend's free tier can only send **to the email you signed up with** until you
   verify a sending domain. To email `nagham_mohamed@rayais.com` reliably, verify a
   domain you control in **Resend → Domains** (e.g. `rayais.com` or a subdomain), then
   set `NOTIFY_FROM_EMAIL` to an address on that domain.
3. Resend → API Keys → create a key.
4. Until this is set up, submissions still succeed and the PDF/Word download buttons
   still work — only the automatic email is skipped (the confirmation screen says so).

### 3. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`,
`NOTIFY_FROM_EMAIL`. `NOTIFY_TO_EMAIL` is already set to
`nagham_mohamed@rayais.com`.

### 4. Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000` — it redirects to your private draft link.

### 5. Deploy

Any Next.js host (e.g. Vercel) works — set the same environment variables there, then
send the client your deployed URL (or a specific `/q/<token>` link).

## Notes

- There's no login for the client — the link itself is the access control. Don't post
  it publicly.
- Re-submitting (editing after submit, then submitting again) reuses the same
  submission reference and regenerates/re-emails the documents.
- The generated documents are a complete, generic dump of every answered field,
  organized by section and per plan (`src/lib/document/content-model.ts`) — not a
  hand-styled RD.011 template. If you want a more polished layout later, that file is
  the place to customize it.
