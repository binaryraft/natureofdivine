
import type { Metadata } from "next";
import { TermsClient } from "./TermsClient";

export const metadata: Metadata = {
  title: 'Terms and Conditions | Nature of the Divine',
  description: 'Review the complete terms and conditions for using the "Nature of the Divine" website and for purchasing our products. This page outlines your rights and responsibilities as a user and customer of our service.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return <TermsClient />;
}
