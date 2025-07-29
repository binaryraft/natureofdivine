
import type { Metadata } from "next";
import { PrivacyClient } from "./PrivacyClient";

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read the privacy policy for Nature of the Divine, outlining how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}

    