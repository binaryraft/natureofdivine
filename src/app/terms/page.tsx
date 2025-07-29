
import type { Metadata } from "next";
import { TermsClient } from "./TermsClient";

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description: 'Review the terms and conditions for using the Nature of the Divine website and purchasing our products.',
};

export default function TermsPage() {
  return <TermsClient />;
}

    