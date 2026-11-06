import type { Metadata } from "next";

import { LegalShell } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Privacy notice",
  description:
    "How MailDrop handles recipient addresses, message content, attachments, security signals, and delivery metadata.",
  alternates: { canonical: "/privacy" },
};

const toc = [
  { id: "overview", label: "Overview" },
  { id: "what-we-process", label: "What we process" },
  { id: "attachments", label: "Attachments" },
  { id: "how-we-use-it", label: "How we use it" },
  { id: "providers", label: "Service providers" },
  { id: "retention", label: "Retention" },
  { id: "cookies", label: "Cookies" },
  { id: "security", label: "Security" },
  { id: "choices", label: "Your choices" },
  { id: "changes", label: "Changes" },
];

export default function PrivacyPage() {
  return (
    <LegalShell
      eyebrow="Privacy notice"
      title="Privacy, without the fine-print games."
      description="MailDrop is designed to send a message without collecting a personal mailbox, building a contact database, or keeping your files around. Here is exactly what happens when you use it."
      updated="6 November 2026"
      toc={toc}
    >
      <h2 id="overview">Overview</h2>
      <p>
        MailDrop is a web application that lets you compose an email, choose recipients, add
        attachments, preview the result, and submit it for delivery through{" "}
        <a href="https://resend.com" target="_blank" rel="noopener noreferrer">
          Resend
        </a>
        . You do not create an account, connect a personal inbox, or provide your own email
        address to use the composer.
      </p>
      <p>
        This deployment currently uses Resend&apos;s test sender,
        <strong> MailDrop &lt;onboarding@resend.dev&gt;</strong>. Resend test mode only permits
        delivery to the email address associated with the Resend account until a custom sending
        domain is verified.
      </p>
      <p>
        This notice describes the default behavior of the MailDrop application. The person or
        organization operating this deployment (the &ldquo;site operator&rdquo;) is responsible
        for the deployment and for any additional policies they publish.
      </p>

      <h2 id="what-we-process">What we process</h2>
      <p>When you submit the composer, the application processes:</p>
      <ul>
        <li>
          <strong>Recipient addresses</strong> that you enter, so that a separate copy can be
          requested for each person.
        </li>
        <li>
          <strong>Subject, message, and formatting</strong> so the email can be rendered into
          responsive HTML and a plain-text alternative.
        </li>
        <li>
          <strong>Attachments</strong> that you choose, so they can be attached to the email you
          submit.
        </li>
        <li>
          <strong>Delivery and technical metadata</strong>, such as the fixed sender address,
          provider message identifiers, submission outcome, timestamps, IP address, and browser
          information. The email provider and its infrastructure providers may process this
          metadata to deliver and secure the message.
        </li>
        <li>
          <strong>Abuse-prevention signals</strong>, including short-lived rate-limit counters,
          daily recipient quota counters, and a one-way hash of your IP address used for
          monitoring and rate limiting.
        </li>
      </ul>
      <p>
        MailDrop does not ask for your name, phone number, personal email address, or mailbox
        credentials. Please do not include personal information in your message or attachments
        unless it is necessary for the recipients you chose.
      </p>

      <h2 id="attachments">Attachments</h2>
      <p>
        Attachments are validated on the server, held in memory only for the lifetime of the
        sending request, and discarded after the provider request completes. MailDrop does not
        write uploaded files to a database, object store, or the application filesystem.
      </p>
      <p>
        The email provider processes the attachment content in order to deliver the message. The
        provider&apos;s own retention settings apply to its delivery records and email logs. Only
        approved image and document formats are accepted; executable and script file types are
        blocked.
      </p>

      <h2 id="how-we-use-it">How we use it</h2>
      <ul>
        <li>To render and preview the email you are composing at your request.</li>
        <li>To submit individual copies to the email provider for your recipients.</li>
        <li>To enforce rate, quota, and recipient limits.</li>
        <li>To detect abuse, protect the sending domain, and diagnose operational failures.</li>
        <li>To comply with legal obligations and enforce the acceptable-use policy.</li>
      </ul>
      <p>
        MailDrop does not sell personal information, build advertising profiles, or use message
        content for marketing. There is no analytics or advertising tracker in the application.
      </p>

      <h2 id="providers">Service providers</h2>
      <p>
        A production deployment may rely on the following infrastructure providers. Each provider
        processes only the data necessary for its role:
      </p>
      <ul>
        <li>
          <strong>Resend</strong> — delivery of the email, attachment processing, and delivery
          event records. Resend may retain email metadata and content according to its account
          configuration and policies.
        </li>
        <li>
          <strong>Upstash Redis</strong> — short-lived rate-limit counters and a global daily
          recipient quota. Stored keys use hashed identifiers, not raw email addresses or message
          content.
        </li>
        <li>
          <strong>Vercel</strong> — application hosting, serverless execution, and operational
          logs. Application logs deliberately omit message content, recipient addresses, and
          attachment contents.
        </li>
      </ul>
      <p>
        These providers may process data in countries other than yours. Their own privacy terms
        and data-processing agreements apply in addition to this notice.
      </p>

      <h2 id="retention">Retention</h2>
      <ul>
        <li>
          <strong>Message content, recipient lists, and attachments:</strong> not retained by the
          MailDrop application after the request completes. They may be visible in the email
          provider&apos;s delivery records subject to the provider&apos;s settings.
        </li>
        <li>
          <strong>Rate-limit and quota counters:</strong> short windows of 10 minutes to 24 hours,
          plus a daily global recipient counter retained for up to 48 hours.
        </li>
        <li>
          <strong>Application logs:</strong> operational events without message content,
          recipient addresses, filenames, or attachment contents, retained according to the
          hosting provider&apos;s log retention.
        </li>
        <li>
          <strong>Hashed IP identifiers:</strong> used in security logs and rate limiting, not
          reversible through the application.
        </li>
      </ul>

      <h2 id="cookies">Cookies and local storage</h2>
      <p>
        MailDrop does not use advertising cookies, cross-site tracking pixels, or account session
        cookies. The composer keeps your draft in browser memory only; it is not saved to local
        storage by MailDrop.
      </p>

      <h2 id="security">Security</h2>
      <p>
        Sending happens exclusively on the server. The Resend API key is never exposed to the
        browser, and the From address is fixed by the site operator. The application uses
        server-side validation, HTML escaping, header-injection protection, attachment type and
        signature checks, rate limiting, and a daily recipient quota. Transport between your
        browser and the application is encrypted when served over HTTPS.
      </p>
      <p>
        No system is completely secure. Do not send sensitive information such as passwords,
        financial account numbers, government identifiers, or health records unless you are
        comfortable with the email provider processing it.
      </p>

      <h2 id="choices">Your choices and rights</h2>
      <p>
        Because MailDrop does not maintain a mailbox or a contact database, there is usually no
        stored message or recipient list to access or delete. You can choose not to include
        personal details in a message. If you need to exercise a privacy right or ask about a
        specific deployment, contact the site operator through the contact channel they publish
        for this site. You may also contact the relevant infrastructure provider directly.
      </p>
      <p>
        MailDrop is not directed to children under 13, and the service should not be used to send
        content that is unlawful, abusive, or unsolicited.
      </p>

      <h2 id="changes">Changes to this notice</h2>
      <p>
        This notice may be updated when the application, its providers, or legal requirements
        change. The &ldquo;last updated&rdquo; date at the top of the page reflects the current
        version. Material changes should be communicated by the site operator where appropriate.
      </p>
      <p>
        For the rules that apply to using the service, see the{" "}
        <a href="/terms">acceptable-use policy</a>. This notice describes an application&apos;s
        default configuration and is not a substitute for legal advice; the site operator should
        review it for their specific deployment and jurisdiction.
      </p>
    </LegalShell>
  );
}
