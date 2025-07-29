
import type { Metadata } from "next";
import { TermsClient } from "./TermsClient";

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description: 'Review the complete terms and conditions for using the "Nature of the Divine" website and purchasing our products. This page outlines your rights and responsibilities as a user and customer.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return <TermsClient />;
}
