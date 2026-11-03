import type { Metadata } from "next";

import { Features } from "@/components/home/Features";
import { FinalCta } from "@/components/home/FinalCta";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { SecuritySection } from "@/components/home/SecuritySection";

export const metadata: Metadata = {
  title: "MailDrop — Your message. Your recipients. One simple place.",
  description:
    "Compose beautifully formatted emails, attach your files, and deliver your information securely to multiple recipients. No personal mailbox required.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <SecuritySection />
      <FinalCta />
    </>
  );
}
