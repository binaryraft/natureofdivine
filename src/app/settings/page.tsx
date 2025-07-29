
import type { Metadata } from 'next';
import { SettingsClient } from './SettingsClient';

export const metadata: Metadata = {
  title: 'Account Settings',
  description: 'Manage your personal account settings for the "Nature of the Divine" website. Update your profile information, change your password, and view your saved details.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/settings',
  },
};

export default function SettingsPage() {
    return <SettingsClient />;
}
