
import type { Metadata } from "next";
import { PrivacyClient } from "./PrivacyClient";

export const metadata: Metadata = {
  title: 'Privacy Policy | Nature of the Divine',
  description: 'Read the official privacy policy for the "Nature of the Divine" website. This document outlines exactly how we collect, use, and protect your personal information when you purchase our book or use our services.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
