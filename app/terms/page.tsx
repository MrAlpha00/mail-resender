import type { Metadata } from "next";

import { LegalShell } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Acceptable use",
  description:
    "The rules for using MailDrop: consent, no spam, prohibited content, attachment limits, and service terms.",
  alternates: { canonical: "/terms" },
};

const toc = [
  { id: "agreement", label: "Agreement" },
  { id: "permitted-use", label: "Permitted use" },
  { id: "consent", label: "Recipient consent" },
  { id: "prohibited", label: "Prohibited use" },
  { id: "attachments", label: "Attachments" },
  { id: "limits", label: "Limits & availability" },
  { id: "delivery", label: "Delivery" },
  { id: "content", label: "Your content" },
  { id: "security", label: "Security" },
  { id: "liability", label: "Liability" },
  { id: "changes", label: "Changes" },
];

export default function TermsPage() {
  return (
    <LegalShell
      eyebrow="Acceptable use"
      title="A simple deal: send thoughtfully, send with consent."
      description="MailDrop is a personal-scale composition tool, not a bulk marketing platform or a public email relay. These rules keep the service safe for recipients, the sending domain, and everyone who relies on it."
      updated="3 November 2026"
      toc={toc}
    >
      <h2 id="agreement">Agreement</h2>
      <p>
        By accessing or using MailDrop, you agree to this acceptable-use policy and to the{" "}
        <a href="/privacy">privacy notice</a>. If you do not agree, do not use the service. If you
        use MailDrop on behalf of an organization, you confirm that you have authority to accept
        these terms for that organization.
      </p>
      <p>
        The site operator may suspend, limit, or block access at any time to protect recipients,
        the sending domain, infrastructure, or other users.
      </p>

      <h2 id="permitted-use">Permitted use</h2>
      <p>
        You may use MailDrop to send a reasonable number of legitimate, individually addressed
        emails to people who expect to hear from you. Examples include sharing files with a small
        project group, sending an update to colleagues, or delivering information to clients who
        have asked for it.
      </p>
      <p>
        MailDrop is intended for personal and small-group communication. It is not intended for
        bulk marketing, cold outreach, mailing lists, lead generation, or any use that resembles a
        commercial email service provider.
      </p>

      <h2 id="consent">Recipient consent</h2>
      <p>You must have a lawful basis to contact every recipient. In particular, you must not:</p>
      <ul>
        <li>Send unsolicited commercial email, chain letters, or bulk advertising.</li>
        <li>Use purchased, scraped, rented, or harvested address lists.</li>
        <li>Continue contacting someone who has asked you to stop.</li>
        <li>Use MailDrop to evade spam filters, blocks, or a recipient&apos;s preferences.</li>
        <li>Misrepresent your identity, affiliation, or the purpose of the message.</li>
      </ul>

      <h2 id="prohibited">Prohibited use</h2>
      <p>You must not use MailDrop to create, send, or facilitate:</p>
      <ul>
        <li>Unlawful, fraudulent, deceptive, harassing, threatening, or defamatory content.</li>
        <li>Malware, phishing, credential theft, or links to malicious destinations.</li>
        <li>Child sexual abuse material, exploitation, or content that endangers minors.</li>
        <li>Content that infringes intellectual property, privacy, or other rights.</li>
        <li>Impersonation of a person, company, brand, or domain you do not represent.</li>
        <li>Attempts to probe, overload, bypass, or reverse-engineer the service or its security controls.</li>
        <li>Automated submission through bots, scripts, or circumvention of rate limits, quotas, or recipient limits.</li>
        <li>Any use that would violate the sending domain&apos;s provider policies or applicable law.</li>
      </ul>
      <p>
        The From address is controlled by the site operator. You may not attempt to change it,
        inject email headers, or use the service to impersonate another sender or domain.
      </p>

      <h2 id="attachments">Attachments</h2>
      <p>
        Only explicitly approved image and document file types may be attached. Executable,
        script, macro-enabled, and other blocked file types are rejected. Files are validated for
        size, type, and basic file signature, and are held in memory only for the sending request.
      </p>
      <p>
        You are responsible for ensuring you have the right to share every file you attach. Do not
        upload malware, illegal content, or confidential material you are not authorized to send.
      </p>

      <h2 id="limits">Limits and availability</h2>
      <p>
        MailDrop applies recipient limits, attachment limits, request-size limits, per-IP rate
        limits, and a shared daily recipient ceiling. Limits may change without notice to protect
        the service. Attempts to bypass them can result in immediate blocking.
      </p>
      <p>
        The service is provided on an &ldquo;as available&rdquo; basis. It may be unavailable
        during maintenance, provider outages, configuration changes, or capacity events. There is
        no guarantee of uptime.
      </p>

      <h2 id="delivery">Delivery is not guaranteed</h2>
      <p>
        This deployment currently uses Resend&apos;s test sender. Resend only accepts the email
        address associated with the Resend account until a custom sending domain is verified.
        Other recipients will be rejected; MailDrop reports those rejections as failures.
      </p>
      <p>
        A successful submission means the email provider accepted the request for delivery. It
        does not mean the message reached an inbox. Delivery can be delayed, filtered, bounced,
        rejected, or marked as spam by the recipient&apos;s provider. Delivery events and bounce
        information are maintained by the email provider, not by MailDrop.
      </p>
      <p>
        Do not use MailDrop for time-critical, legally binding, medical, financial, or
        safety-critical communications where a failed delivery could cause harm.
      </p>

      <h2 id="content">Your content and responsibility</h2>
      <p>
        You retain responsibility for the content you submit. You grant the site operator and its
        infrastructure providers the limited permission needed to process, render, transmit, and
        deliver your message and attachments. You confirm that your content and recipient list
        comply with this policy and applicable law.
      </p>
      <p>
        MailDrop does not claim ownership of your message. The application does not retain message
        content or attachments after the request, though the email provider may retain delivery
        records as described in the privacy notice.
      </p>

      <h2 id="security">Security</h2>
      <p>
        Do not attempt to access another person&apos;s data, interfere with the service, or test
        security controls without written authorization from the site operator. Report suspected
        vulnerabilities responsibly to the site operator. Do not include sensitive personal data
        in a message unless it is necessary and appropriate.
      </p>

      <h2 id="liability">Disclaimer and limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, the service is provided without warranties of any
        kind, express or implied. The site operator is not liable for indirect, incidental,
        special, consequential, or punitive damages, loss of data, loss of profits, failed
        delivery, or misuse of the service. Nothing in these terms limits liability that cannot be
        limited by law.
      </p>
      <p>
        You agree to indemnify the site operator against claims arising from your content,
        recipient lists, or violation of this policy, to the extent permitted by law.
      </p>

      <h2 id="changes">Changes and contact</h2>
      <p>
        This policy may be updated as the service or legal requirements change. The
        &ldquo;last updated&rdquo; date reflects the current version. Continued use after a change
        means you accept the updated policy.
      </p>
      <p>
        Questions about this deployment should be directed to the site operator through the
        contact channel they publish for this site. This policy is a practical default for the
        application and is not legal advice; the site operator should review it for their specific
        jurisdiction and use case.
      </p>
    </LegalShell>
  );
}
