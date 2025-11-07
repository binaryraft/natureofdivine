
import type { Metadata } from "next";
import { TermsClient } from "./TermsClient";

export const metadata: Metadata = {
  title: 'Terms & Conditions | Nature of the Divine',
  description: 'Read the terms and conditions for using the Nature of the Divine website and purchasing our products. This document outlines your rights and responsibilities as a user and customer.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return <TermsClient />;
}
