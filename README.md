# MailDrop

A multi-recipient email composer built with Next.js and Resend.

MailDrop lets a visitor write one message, add recipients, attach approved files, preview three responsive email templates, and submit each recipient as an **individual email**. Sending happens entirely on the server; the Resend API key is never exposed to the browser and visitors cannot change the `From` address.

---

## Current configuration: production sender

This deployment sends from the fixed address:

```text
MailDrop <no-reply@maildrops.online>
```

The sender is hardcoded on the server. There is no sender-email environment variable and no frontend control for the `From` address.

**Requirement:** `maildrops.online` must be verified as a sending domain in Resend. If Resend reports that the domain or its DNS records are not verified, delivery fails honestly with a provider error; the app never falls back to a test sender.

Cloudflare Turnstile remains disabled. The old Turnstile helper remains in the repository for future reactivation, but it is not imported by the active send endpoint or composer, and no Cloudflare configuration is required.

---

## What is included

- **Marketing home page** with product, security, and workflow sections.
- **Composer** at `/compose` with:
  - Recipient chip input, paste parsing, deduplication, and configurable maximum recipients.
  - Subject and message validation, character counter, and safe toolbar formatting.
  - Drag-and-drop attachments with allowlist, per-file/total size checks, and upload progress.
  - Three responsive email templates: Modern Professional, Minimal, and Elegant Dark.
  - Desktop/mobile preview modal that renders the same HTML structure as the outbound email.
  - Readiness checklist and per-recipient results.
  - Retry flow for failed recipients only.
- **Secure API route** at `POST /api/send-email` with:
  - Same-origin check, multipart-only requests, request-size ceiling, and Zod validation.
  - Per-IP sliding-window rate limits plus a global daily recipient quota in Upstash Redis.
  - Magic-byte attachment verification and safe filename sanitization.
  - One Resend request per recipient, limited concurrency, and Resend idempotency keys.
  - Per-recipient accepted/failed results without leaking provider internals.
- **Legal pages** at `/privacy` and `/terms`.
- **Security headers** in `next.config.ts`.
- **Production fail-closed behavior** when the Resend key or rate-limit store is missing.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router, React 19, TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI motion | Framer Motion, Lucide icons |
| Forms and validation | React Hook Form, Zod |
| Email provider | Resend SDK |
| Rate limiting | Upstash Redis / `@upstash/ratelimit` |
| Temporary attachments | Vercel Blob (private store) |
| Deployment target | Vercel (Node.js runtime for the API routes) |

---

## Environment variables

Only these variables are required for the active configuration:

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | **Yes** | Server-only Resend API key. Never prefix with `NEXT_PUBLIC_`. |
| `UPSTASH_REDIS_REST_URL` | **Yes** | Upstash Redis REST URL for rate limits and the daily quota. |
| `UPSTASH_REDIS_REST_TOKEN` | **Yes** | Upstash Redis REST token. |
| `BLOB_READ_WRITE_TOKEN` | **Yes** | Server-only token for the private Vercel Blob store used by temporary attachment uploads. |
| `CRON_SECRET` | **Yes for cleanup** | Bearer secret checked by `/api/blob/cleanup`; Vercel Cron sends it automatically when configured. |

Optional settings:

| Variable | Default | Purpose |
| --- | --- | --- |
| `MAX_RECIPIENTS` | `15` | Maximum recipients per submission, clamped to 1–50. |
| `GLOBAL_DAILY_RECIPIENT_LIMIT` | `500` | Daily recipient-copy ceiling across all visitors, clamped to 1–100,000. |
| `ABUSE_HASH_SALT` | Development fallback | Salt used when hashing IP addresses in abuse-monitoring logs. Set a private value in production. |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public site origin used in email footers, e.g. `https://maildrops.online`. |

There are no sender-email or Turnstile variables in the active configuration.

### Production behavior when configuration is missing

- Missing `RESEND_API_KEY` → `/api/send-email` returns `503 not_configured`, and the composer disables sending.
- Missing or unreachable Upstash configuration in production → rate limiting fails closed with `503`.
- Missing `BLOB_READ_WRITE_TOKEN` → attachment uploads return `503`; the composer reports that files could not be uploaded. Text-only messages still work.
- Missing `CRON_SECRET` → the cleanup endpoint rejects requests, so abandoned blobs are not removed automatically.
- In local development only, missing Upstash falls back to an in-memory limiter so the UI can be exercised. This is not a production mode.

---

## Local setup

### Requirements

- Node.js **20.9 or newer** (Node 22 LTS recommended)
- npm
- A Resend account for real delivery
- An Upstash Redis database for production-style rate limiting
- A private Vercel Blob store for real attachment uploads

### Install and run

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Open <http://localhost:3000>.

Without a Resend key, the composer still opens and previews emails, but the send button stays disabled and the API returns a safe `503`.

### Verify the project

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

---

## Resend setup

1. Create a [Resend](https://resend.com) account.
2. Create an API key with permission to send email.
3. Set `RESEND_API_KEY` in `.env.local` or Vercel.
4. Add `maildrops.online` as a sending domain in Resend and complete the required DNS verification records.
5. Keep the sender fixed as `MailDrop <no-reply@maildrops.online>` in `lib/constants.ts`. Do not add a user-editable `From` address.

The app does not connect to Gmail, Outlook, personal mailboxes, or personal SMTP credentials.

---

## Upstash setup

1. Create a Redis database at [Upstash](https://upstash.com).
2. Copy the REST URL and REST token.
3. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

Active protection:

- **4 submissions per 10 minutes per IP hash**
- **20 submissions per 24 hours per IP hash**
- **120 attachment uploads per 10 minutes per IP hash**
- **600 attachment uploads per 24 hours per IP hash**
- **Global daily recipient-copy ceiling** controlled by `GLOBAL_DAILY_RECIPIENT_LIMIT` (default 500)

The daily quota reserves the actual recipient count atomically in Redis. A request to 5 recipients consumes 5 units, and the reservation is rolled back if it would exceed the daily ceiling. Failed provider attempts still consume quota because the reservation happens before sending.

---

## Vercel Blob setup

Attachment bytes are uploaded directly from the browser to a **private** Vercel Blob store. The server authorizes each upload, then re-downloads and re-validates the file before sending it through Resend.

1. In Vercel, open **Storage → Create → Blob**.
2. Name the store **`maildrop-attachments`** and choose **Private** access.
3. Connect the store to this project for Production, Preview, and Development. Vercel injects `BLOB_READ_WRITE_TOKEN` into the project environment.
4. For local attachment testing, run `vercel env pull .env.local` or copy the token into `.env.local`.
5. Set `CRON_SECRET` to a long random value in Vercel. The included `vercel.json` schedules `/api/blob/cleanup` daily at 03:00 UTC, and Vercel sends `Authorization: Bearer $CRON_SECRET` to that route.

Never expose `BLOB_READ_WRITE_TOKEN` or `CRON_SECRET` to the browser. The browser only receives short-lived, path-scoped upload tokens issued by `/api/blob/upload`.

Uploaded blobs use the path format `maildrop/<submission-id>/<file-id>`. The server only accepts pathnames that match the submitted ID and a strict UUID. Blobs are deleted after the send attempt. A daily cleanup job deletes anything still under `maildrop/` that is more than one hour old at the time it runs.

---

## Deployment on Vercel

The project is deployed at <https://maildrops.online>.

1. Import the repository into Vercel if it is not already connected.
2. Create and connect the private `maildrop-attachments` Blob store as described above.
3. Add `RESEND_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and `CRON_SECRET` under **Project → Settings → Environment Variables** for Production (and Preview if needed). Connecting the Blob store adds `BLOB_READ_WRITE_TOKEN` automatically.
4. Set `NEXT_PUBLIC_APP_URL` to `https://maildrops.online`.
5. Redeploy after changing environment variables. `NEXT_PUBLIC_*` values are embedded at build time.
6. Confirm `maildrops.online` is verified in Resend and the API key belongs to the same Resend account.

The API route uses the Node.js runtime (`export const runtime = "nodejs"`) and a 60-second maximum duration. The upload-token and cleanup routes also use the Node.js runtime.

### Request-size and attachment limits

Vercel Functions limit the request body to **4.5 MB**. MailDrop bypasses that ceiling for attachment bytes by uploading each file directly from the browser to private Vercel Blob storage. `/api/send-email` receives only attachment metadata, so it stays well under the function limit.

| Limit | Value |
| --- | --- |
| Files per email | **30** |
| Size per file | **15 MB** |
| Combined raw attachment size | **30 MB** |
| Metadata request body | **4.4 MB ceiling** (metadata only) |
| Resend email limit | **40 MB including Base64 encoding** |
| MailDrop encoded-payload guard | **39 MB** (leaves room for HTML/text/MIME) |

The same constants are used by the browser and the server. Server-side validation is authoritative and independently enforces the count, per-file size, total size, MIME type, and magic-byte checks.

Resend's 40 MB limit applies to the whole email after attachments are Base64 encoded. Base64 adds roughly one third, and inline images are sent twice: once as a CID part for the inline preview and once as a normal downloadable attachment. MailDrop estimates that encoded payload before downloading files and rejects oversized submissions with a clear error instead of relying on a provider rejection.

Approved attachments: JPG, JPEG, PNG, WEBP, GIF, PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, RTF, ODT, ODS, ODP.

Files are stored only in the private Blob store for the short period between upload and send. They are deleted after the send attempt, and a scheduled cleanup removes abandoned uploads older than one hour at its next run.

---

## How sending works

1. The browser validates text, recipients, attachment count, sizes, and the estimated encoded payload locally. When you submit, it requests a short-lived upload token for each file and uploads the bytes directly to the private Blob store.
2. The browser sends only recipient/content fields and attachment `{ pathname, filename }` metadata to `POST /api/send-email`.
3. `POST /api/send-email` checks the origin, content type, request size, Resend configuration, and rate limits.
4. The server parses the form, validates it with Zod, normalizes and deduplicates recipients, and checks the recipient limit.
5. Each attachment pathname must belong to the submitted ID. The server calls `head()` to enforce expiry, size, count, MIME type, and the encoded Resend payload guard, then downloads the private blob, checks the file signature, and keeps the bytes in memory for the provider request. Every file is sent as a Base64 MIME attachment. Images are sent twice: a CID part for the inline preview and a separate regular attachment for native download.
6. The server atomically reserves the actual recipient count against the global daily quota and renders the selected template with escaped user content.
7. Each recipient receives a separate Resend call with the same attachments and a per-recipient idempotency key. Concurrency is capped at 3.
8. The response returns per-recipient `accepted` or `failed` results. The UI distinguishes complete success, partial failure, and total failure, and offers retry for failed recipients only.
9. Temporary blobs are deleted in a `finally` block after the send attempt. The daily cleanup job removes abandoned uploads older than one hour.

### API response shape

Successful submission (HTTP `200`), even when some recipients fail:

```json
{
  "ok": true,
  "requestId": "…",
  "results": [
    { "recipient": "account@example.com", "status": "accepted", "id": "resend-id" },
    {
      "recipient": "external@example.com",
      "status": "failed",
      "error": "The MailDrop sending domain is not verified in Resend. Verify the DNS records for maildrops.online in the Resend dashboard, then try again."
    }
  ],
  "summary": { "total": 2, "accepted": 1, "failed": 1 }
}
```

Validation or security failure (HTTP `400`, `403`, `413`, `415`, `429`, `500`, or `503`):

```json
{
  "ok": false,
  "requestId": "…",
  "code": "invalid_request",
  "message": "Please check the highlighted fields.",
  "fieldErrors": { "recipients": ["Add at least one recipient."] }
}
```

`accepted` means Resend accepted the email request. It does not guarantee inbox placement, and MailDrop does not claim otherwise. Provider rejections are reported as failures with a specific explanation.

---

## Security and privacy model

- **Server-only secrets.** `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`, and `CRON_SECRET` are never sent to the browser.
- **Fixed sender.** `MailDrop <no-reply@maildrops.online>` is hardcoded in `lib/constants.ts`. User input cannot alter the `From` header.
- **No raw HTML.** The message is escaped first, then a small safe syntax (`**bold**`, `_italic_`, bullet/numbered lists, blank lines) is converted into the email HTML.
- **No content logging.** Recipient addresses, subjects, message bodies, filenames, and attachment bytes are never written to logs. Only request IDs, hashed IPs, counts, statuses, durations, and coarse reasons are logged.
- **Origin checks.** Cross-origin browser submissions are rejected. Requests without an `Origin` header are allowed; this is not an authentication mechanism.
- **Abuse controls.** Per-IP send and upload limits plus a global daily recipient ceiling protect the Resend account and the Blob store.
- **Attachment safety.** Extension allowlist, MIME checks, size limits, filename sanitization, and magic-byte signature verification. Attachment pathnames are scoped to the submission ID and validated as UUIDs.
- **Private temporary storage.** Vercel Blob is configured with private access. Browsers never receive the store token or a public attachment URL; the server downloads files with its own token.
- **Temporary retention.** Blobs are deleted after the send attempt, and `/api/blob/cleanup` deletes abandoned uploads older than one hour at its next run. That route requires `CRON_SECRET`.
- **No delivery overclaiming.** Results reflect Resend responses only. Failures are shown per recipient.
- **Duplicate protection.** The submit guard runs before the first `await`, and Resend idempotency keys use the client-generated submission ID and recipient index.
- **No CAPTCHA dependency.** Turnstile code is retained but inactive, and no Cloudflare keys are required.

If you operate MailDrop publicly, review `/terms` and `/privacy`, and adapt them to your organization, jurisdiction, and provider agreements. The included pages describe the app's actual behavior but are not legal advice.

### Not included

- Inbox access, mailbox sync, or Gmail/Outlook integration.
- User-supplied `From` addresses or personal SMTP credentials.
- Arbitrary HTML, tracking pixels, open/click analytics, or scheduled campaigns.
- Contact lists, unsubscribe management, or CRM features.
- Long-term file storage. Attachments live in a private temporary Blob store and are deleted after sending, or by scheduled cleanup once an abandoned upload is more than one hour old.

---

## Testing

### Automated checks

```bash
npm run lint
npm run typecheck
npm run build
```

### Local smoke test

Start the app and open `/`, `/compose`, `/privacy`, and `/terms`.

Expected behavior without credentials:

- Pages render.
- The sender card shows `MailDrop <no-reply@maildrops.online>`.
- The send button is disabled when `RESEND_API_KEY` is missing.
- `POST /api/send-email` returns a safe `503 not_configured` after the origin and content-type checks.

Test API guards with PowerShell:

```powershell
# Wrong content type → 415
Invoke-WebRequest -Method POST -Uri http://localhost:3000/api/send-email `
  -Headers @{ "Content-Type" = "application/json" } -Body "{}"
```

```powershell
# Cross-origin request → 403
Invoke-WebRequest -Method POST -Uri http://localhost:3000/api/send-email `
  -Headers @{
    "Content-Type" = "multipart/form-data; boundary=x"
    "Origin" = "https://evil.example"
  } -Body "--x--"
```

### End-to-end test with real credentials

1. Set `RESEND_API_KEY`, Upstash credentials, `BLOB_READ_WRITE_TOKEN`, and `CRON_SECRET` in `.env.local`.
2. Confirm `maildrops.online` is verified in Resend.
3. Restart `npm run dev`.
4. Send a controlled message to an address you control.
5. Confirm the preview matches the received email and that PDFs/documents appear as native attachments.
6. For an image, confirm it appears inline in the body and also appears as a separate downloadable attachment.
7. Test a file with a disguised extension and confirm it is rejected.
8. Confirm a successful send deletes its temporary blobs from the Blob store.
9. Call `/api/blob/cleanup` with the configured `Authorization: Bearer $CRON_SECRET` header and confirm it returns `{ "ok": true }`.
10. Submit twice rapidly and confirm only one submission is processed.
11. Exceed the rate limit and confirm a `429` with a friendly retry message.

For a production smoke test, repeat against <https://maildrops.online> with the production environment variables.

---

## Remaining production requirement

The application sender is production-ready, but live delivery depends on Resend accepting `maildrops.online` as a verified sending domain. In Resend:

- Add the domain and publish the required DNS records (typically SPF, DKIM, and a return-path/MX record).
- Wait for Resend to report the domain and its records as verified.
- Keep `RESEND_API_KEY` scoped to the account that owns the verified domain.

If verification is incomplete, Resend rejects the send and MailDrop reports the provider failure per recipient. It never falls back to another sender.
