# MailDrop

A production-minded, multi-recipient email composer built with Next.js and Resend.

MailDrop lets a visitor write one message, add up to a configurable number of recipients, attach approved files, preview three responsive email templates, and submit each recipient as an **individual email**. It never exposes the Resend API key to the browser, never accepts a user-supplied `From` address, and never claims a message was delivered when the provider did not accept it.

---

## What is included

- **Marketing home page** with product, security, and workflow sections.
- **Composer** at `/compose` with:
  - Recipient chip input, paste parsing, deduplication, and configurable maximum recipients.
  - Subject and message validation, character counter, and safe toolbar formatting.
  - Drag-and-drop attachments with allowlist, per-file/total size checks, and upload progress.
  - Three real responsive email templates: Modern Professional, Minimal, and Elegant Dark.
  - Desktop/mobile preview modal that renders the same HTML structure as the outbound email.
  - Readiness checklist, duplicate-submission protection, CAPTCHA, and per-recipient results.
  - Retry flow for failed recipients only.
- **Secure API route** at `POST /api/send-email` with:
  - Same-origin check, multipart-only requests, request-size ceiling, and Zod validation.
  - Cloudflare Turnstile server verification.
  - Per-IP sliding-window rate limits plus a global daily recipient quota in Upstash Redis.
  - Magic-byte attachment verification and safe filename sanitization.
  - One Resend request per recipient, limited concurrency, and Resend idempotency keys.
  - Per-recipient accepted/failed results without leaking provider internals.
- **Legal pages** at `/privacy` and `/terms`.
- **Security headers** including a CSP that permits only Cloudflare Turnstile and same-origin resources.
- **Deployment-ready configuration** with production fail-closed behavior.

> **Important:** the repository does **not** contain working credentials. Real delivery requires a Resend API key attached to a **verified sending domain**, Turnstile keys, and an Upstash Redis database. See [What you must provide before production](#what-you-must-provide-before-production).

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router, React 19, TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI motion | Framer Motion, Lucide icons |
| Forms and validation | React Hook Form, Zod |
| Email provider | Resend SDK |
| Bot protection | Cloudflare Turnstile |
| Persistent rate limiting | Upstash Redis / `@upstash/ratelimit` |
| Deployment target | Vercel (Node.js runtime for the API route) |

---

## Project structure

```text
app/
  api/send-email/route.ts   Secure multipart email endpoint
  compose/page.tsx          Server page that loads runtime composer config
  privacy/page.tsx          Privacy notice
  terms/page.tsx            Acceptable-use policy
  layout.tsx                Metadata and global shell
  globals.css               Design tokens and base styles
components/
  email/                    Composer, recipient input, attachments, preview, results
  home/                     Home page sections
  layout/                   Header and footer
  legal/                    Legal page shell
  ui/                       Small shared UI primitives
lib/
  attachments.ts            Attachment allowlist, size limits, magic-byte checks
  constants.ts              Shared limits used by browser and server
  email-templates.ts        Escaped mini-markdown and the three email templates
  rate-limit.ts             Upstash rate limiting and global recipient quota
  resend.ts                 Server-only Resend client
  security.ts               Origin check, IP hashing, safe errors, redacted logs
  settings.ts               Runtime configuration and sender resolution
  turnstile.ts              Cloudflare server-side verification
  validation.ts             Zod schemas and normalization
types/email.ts              Shared API, template, and config types
```

---

## Local setup

### 1. Requirements

- Node.js **20.9 or newer** (Node 22 LTS recommended)
- npm
- A Resend account for real delivery
- Cloudflare Turnstile and Upstash accounts for production

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the environment

Copy the example file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Fill in the variables you have. A local setup with **no** credentials still lets you open the UI and preview emails: the composer shows a delivery-not-configured banner, the send button stays disabled, and the API returns a safe `503` instead of attempting delivery.

### 4. Run the development server

```bash
npm run dev
```

Open <http://localhost:3000>.

### 5. Verify the project

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

`npm start` serves the production build on port 3000 by default.

---

## Environment variables

All variables are documented in `.env.example`.

| Variable | Required in production | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | **Yes** | Server-only Resend API key. Never prefix with `NEXT_PUBLIC_`. |
| `RESEND_FROM_EMAIL` | **Yes** | Sender address on a domain verified in Resend, e.g. `noreply@mail.example.com`. |
| `RESEND_FROM_NAME` | No | Display name for the sender. Defaults to `MailDrop`. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | **Yes** | Public Turnstile site key rendered in the browser. |
| `TURNSTILE_SECRET_KEY` | **Yes** | Server-only Turnstile secret used for `siteverify`. |
| `TURNSTILE_EXPECTED_HOSTNAME` | Recommended | Restricts accepted Turnstile tokens to the production hostname. |
| `UPSTASH_REDIS_REST_URL` | **Yes** | Upstash Redis REST URL. |
| `UPSTASH_REDIS_REST_TOKEN` | **Yes** | Upstash Redis REST token. |
| `MAX_RECIPIENTS` | No | Maximum recipients per submission, clamped to 1–50. Defaults to 15. |
| `GLOBAL_DAILY_RECIPIENT_LIMIT` | No | Daily recipient-copy ceiling across all visitors, clamped to 1–100,000. Defaults to 500. |
| `ABUSE_HASH_SALT` | Recommended | Salt used when hashing IP addresses in abuse-monitoring logs. |
| `NEXT_PUBLIC_APP_URL` | Recommended | Public site origin used in email footers, e.g. `https://mail.example.com`. |

### Production behavior when configuration is missing

MailDrop fails closed in production rather than becoming an open email relay:

- Missing Resend key or sender → `/api/send-email` returns `503 not_configured`.
- Missing Turnstile secret in production → CAPTCHA verification fails closed with `503`.
- Missing Upstash configuration in production → rate limiting fails closed with `503`.
- The composer disables sending until delivery is configured.

In local development only, missing Upstash falls back to an in-memory limiter and a missing Turnstile secret skips CAPTCHA. This exists solely to make local UI work possible. It is **not** a production mode.

---

## Third-party setup

### Resend

1. Create a [Resend](https://resend.com) account.
2. Add a domain you control under **Domains**.
3. Add the DNS records Resend provides (SPF and DKIM; add DMARC as recommended).
4. Wait until the domain status is **Verified**.
5. Create an API key with permission to send email.
6. Set `RESEND_API_KEY` and a sender on that domain in `RESEND_FROM_EMAIL`, for example:
   ```dotenv
   RESEND_API_KEY=re_...
   RESEND_FROM_EMAIL=noreply@mail.example.com
   RESEND_FROM_NAME=MailDrop
   ```

The app always uses this fixed, verified sender. Visitors cannot change the `From` address, and MailDrop does not connect to Gmail, Outlook, or any personal mailbox.

Resend's testing sender (`onboarding@resend.dev`) can only send to the account owner and is not suitable for public production use.

### Cloudflare Turnstile

1. In the Cloudflare dashboard, create a Turnstile widget.
2. Add the hostnames that will serve MailDrop. Include `localhost` for local development if you want to test CAPTCHA locally.
3. Copy the **site key** to `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
4. Copy the **secret key** to `TURNSTILE_SECRET_KEY`.
5. Optionally set `TURNSTILE_EXPECTED_HOSTNAME` to the production hostname (no protocol or path).

The client renders the widget with the action `maildrop_send`, and the server verifies the token, action, and optional hostname.

### Upstash Redis

1. Create a Redis database at [Upstash](https://upstash.com).
2. Copy the REST URL and REST token.
3. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

Rate limits used by the app:

- **4 submissions per 10 minutes per IP hash**
- **20 submissions per 24 hours per IP hash**
- **Global daily recipient-copy ceiling** controlled by `GLOBAL_DAILY_RECIPIENT_LIMIT` (default 500)

The global quota counts recipient copies, not submissions. For example, a successful request to 5 recipients consumes 5 units. Failed provider attempts still consume quota; the reservation happens before sending so the account is protected even under abuse.

---

## Deployment on Vercel

1. Push the repository to a Git provider.
2. Import the project into Vercel. The framework preset should be detected as **Next.js**.
3. Add every required production environment variable under **Project → Settings → Environment Variables** for the **Production** environment. Add them to **Preview** as well if preview deployments should send email.
4. Deploy.
5. Set `NEXT_PUBLIC_APP_URL` to the final production origin, for example `https://mail.example.com`.
6. Add that hostname to the Turnstile widget and, ideally, set `TURNSTILE_EXPECTED_HOSTNAME`.
7. Redeploy after changing `NEXT_PUBLIC_*` variables, because those values are embedded at build time.
8. Confirm the Resend domain is still verified.

The API route is pinned to the Node.js runtime (`export const runtime = "nodejs"`) and a 60-second maximum duration. The Resend SDK and multipart processing require that runtime; do not switch the route to the Edge runtime without reworking dependencies.

### Request-size limit on Vercel

Vercel Functions limit the total request body to **4.5 MB**. MailDrop enforces a **4.4 MB** total request ceiling to leave room for multipart overhead.

Current attachment limits:

| Limit | Value |
| --- | --- |
| Files per email | 5 |
| Size per file | 3 MB |
| Combined attachment size | 3.5 MB |
| Total HTTP request body | 4.4 MB |
| Resend attachment limit | 40 MB (not the binding limit here) |

The Resend limit is much higher, but Vercel's request cap is the real constraint. If you need larger attachments, upload files to object storage and send links instead.

---

## How sending works

1. The browser validates text and recipients locally and builds a `multipart/form-data` request.
2. `POST /api/send-email` checks the origin, content type, request size, sender configuration, and rate limits.
3. The server parses the form, validates it with Zod, normalizes and deduplicates recipients, and verifies the Turnstile token.
4. Attachments are checked against the allowlist, size limits, and file signatures. Files remain in memory only for the request.
5. The server reserves the global recipient quota and renders the selected email template with escaped user content.
6. Each recipient receives a separate Resend call with a per-recipient idempotency key. Concurrency is capped at 3.
7. The response returns per-recipient `accepted` or `failed` results. The UI distinguishes complete success, partial failure, and total failure, and offers retry for failed recipients only.

### API response shape

Successful submission (HTTP `200`), even when some recipients fail:

```json
{
  "ok": true,
  "requestId": "…",
  "results": [
    { "recipient": "a@example.com", "status": "accepted", "id": "resend-id" },
    { "recipient": "b@example.com", "status": "failed", "error": "The email provider could not accept this copy. Please try again." }
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

`accepted` means Resend accepted the email for delivery. It does **not** guarantee inbox placement, and MailDrop does not claim otherwise.

---

## Security and privacy model

- **Server-only secrets.** `RESEND_API_KEY` and `TURNSTILE_SECRET_KEY` are never sent to the browser.
- **Fixed sender.** `RESEND_FROM_EMAIL` is resolved server-side. User input cannot alter the `From` header.
- **No raw HTML.** The message is escaped first, then a small safe syntax (`**bold**`, `_italic_`, bullet/numbered lists, blank lines) is converted into the email HTML.
- **No content logging.** Recipient addresses, subjects, message bodies, filenames, and attachment bytes are never written to logs. Only request IDs, hashed IPs, counts, statuses, durations, and coarse reasons are logged.
- **Origin checks.** Cross-origin browser submissions are rejected. Requests without an `Origin` header (for example, server-to-server tools) are allowed; this is not an authentication mechanism.
- **CAPTCHA.** Turnstile tokens are verified server-side with action and optional hostname checks.
- **Abuse controls.** Per-IP limits and a global daily recipient ceiling protect the Resend account.
- **Attachment safety.** Extension allowlist, MIME checks, size limits, filename sanitization, and magic-byte signature verification. Images are also referenced inline in the HTML preview.
- **No delivery overclaiming.** Results reflect Resend responses only. Failures are shown per recipient.
- **Duplicate protection.** The submit guard runs before the first `await`, and Resend idempotency keys use the client-generated submission ID and recipient index.

Approved attachments: JPG, JPEG, PNG, WEBP, GIF, PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, RTF, ODT, ODS, ODP.

### Not included

- Inbox access, mailbox sync, or Gmail/Outlook integration.
- User-supplied `From` addresses or personal SMTP credentials.
- Arbitrary HTML, tracking pixels, open/click analytics, or scheduled campaigns.
- Contact lists, unsubscribe management, or CRM features.
- File storage. Attachments exist only in memory during the request.

If you operate MailDrop publicly, review `/terms` and `/privacy`, and adapt them to your organization, jurisdiction, and provider agreements. The included pages describe the app's actual behavior but are not legal advice.

---

## Testing

### Automated checks

```bash
npm run lint
npm run typecheck
npm run build
```

### Local smoke test without credentials

Start the app and open:

- `/`
- `/compose`
- `/privacy`
- `/terms`

Expected behavior: pages render, the composer shows a delivery-not-configured banner, and the send action is disabled. `POST /api/send-email` returns a safe `503 not_configured` after the origin and content-type checks.

Test the API guards with PowerShell:

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

```powershell
# Missing/invalid configuration in production → 503
Invoke-WebRequest -Method POST -Uri http://localhost:3000/api/send-email `
  -Headers @{ "Content-Type" = "multipart/form-data; boundary=x" } -Body "--x--"
```

### Full end-to-end test with real credentials

1. Configure a verified Resend sender, API key, Turnstile site/secret, and Upstash credentials in `.env.local`.
2. Restart `npm run dev` so the new environment is loaded.
3. Send to an address you control. Use a domain address you own for the sender, not a public provider address.
4. Confirm:
   - The preview matches the received email.
   - Each recipient receives an individual copy (no shared `To` header).
   - Attachments open correctly.
   - The results screen shows accepted IDs for successful copies.
   - Resend's dashboard shows the sends.
5. Test a deliberately invalid recipient and confirm the UI reports a partial or total failure without claiming success.
6. Test a file with a disguised extension and confirm it is rejected.
7. Submit twice rapidly and confirm only one submission is processed.
8. Exceed the rate limit and confirm a `429` with a friendly retry message.

For a production smoke test, repeat against the deployed URL with the production environment variables and a verified sender.

---

## What you must provide before production

The code is complete, but these external items are still required. Without them, production will intentionally refuse to send:

- [ ] **Resend API key** (`RESEND_API_KEY`).
- [ ] **Verified sending domain** in Resend with SPF/DKIM DNS records.
- [ ] **Verified sender address** on that domain (`RESEND_FROM_EMAIL`).
- [ ] **Turnstile site key** (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`).
- [ ] **Turnstile secret key** (`TURNSTILE_SECRET_KEY`).
- [ ] **Turnstile hostname** configured in Cloudflare, and optionally `TURNSTILE_EXPECTED_HOSTNAME`.
- [ ] **Upstash Redis REST URL and token** (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).
- [ ] **Production origin** in `NEXT_PUBLIC_APP_URL`.
- [ ] **`ABUSE_HASH_SALT`** set to a private random value.
- [ ] **All variables added to Vercel** for the production environment, followed by a redeploy.
- [ ] **A real delivery test** to addresses you control from the deployed app.

MailDrop has been built and verified locally (`lint`, `typecheck`, and `next build` pass), but real end-to-end delivery has **not** been verified in this repository because no valid provider credentials or verified domain were supplied.
