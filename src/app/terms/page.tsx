
import type { Metadata } from "next";
import { TermsClient } from "./TermsClient";

export const metadata: Metadata = {
  title: 'Privacy Policy | Nature of the Divine',
  description: 'Learn how Nature of the Divine collects, uses, and protects your personal data in compliance with privacy regulations.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/privacy',
  },
};

export default function TermsPage() {
  return <TermsClient />;
}
