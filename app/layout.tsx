import type { Metadata, Viewport } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getAppUrl } from "@/lib/settings";

import "./globals.css";

const appUrl = getAppUrl();

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "MailDrop — Send a beautiful email to the right people",
    template: "%s · MailDrop",
  },
  description:
    "Compose beautifully formatted emails, attach your files, and deliver your information securely to multiple recipients. No personal mailbox required.",
  applicationName: "MailDrop",
  keywords: [
    "email sender",
    "multi-recipient email",
    "email composer",
    "Resend",
    "private email",
    "send attachments",
  ],
  authors: [{ name: "MailDrop" }],
  creator: "MailDrop",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    siteName: "MailDrop",
    title: "MailDrop — Your message. Your recipients. One simple place.",
    description:
      "A premium multi-recipient email composer with private delivery, attachments, and three beautiful templates.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MailDrop — Your message. Your recipients. One simple place.",
    description:
      "Compose once, reach the right people, and keep every recipient private.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8fafc",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-mist text-ink antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-navy focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
